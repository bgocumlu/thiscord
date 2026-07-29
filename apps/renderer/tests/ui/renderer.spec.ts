import { expect, test, type Page } from '@playwright/test'
import { contrastRatio } from '../../src/lib/colorContrast'

test.describe('renderer accessibility and responsive contracts', () => {
  test.use({ viewport: { width: 320, height: 568 } })

  const mountWorkspaceControls = async (page: Page) => {
    await page.goto('/auth/reset?renderer-test=workspace-controls')
    await expect(page.locator('[data-renderer-test-ready="true"]')).toBeVisible()
    await page.locator('html').evaluate(() => {
      document.documentElement.dataset.theme = 'light'
    })
  }

  test('recovery form reflows without horizontal scrolling and keeps explicit labels', async ({ page }) => {
    await page.goto('/auth/reset')

    await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible()
    await expect(page.getByLabel('New password')).toBeVisible()
    await expect(page.getByLabel('Confirm password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Change password' })).toBeVisible()

    const viewportFit = await page.evaluate(() => ({
      body: document.body.scrollWidth <= document.documentElement.clientWidth,
      document: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    }))
    expect(viewportFit).toEqual({ body: true, document: true })
  })

  test('keyboard focus remains visibly outlined', async ({ page }) => {
    await page.goto('/auth/reset')
    await expect(page.getByLabel('New password')).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    const focusedControl = page.locator(':focus')
    await expect(focusedControl).toBeVisible()

    const focusStyle = await focusedControl.evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        color: style.outlineColor,
        style: style.outlineStyle,
        width: style.outlineWidth,
      }
    })
    expect(focusStyle.style).not.toBe('none')
    expect(Number.parseFloat(focusStyle.width)).toBeGreaterThanOrEqual(2)
  })

  test('a bright custom accent remains contrast-safe in light mode', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('thiscord:appearance:v1', JSON.stringify({
        theme: 'light',
        compactMode: false,
        reduceMotion: false,
      }))
    })
    await page.route('**/distribution.json', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'contrast-test',
          name: 'Contrast test',
          appId: 'chat.thiscord.contrast-test',
          webUrl: 'http://127.0.0.1:4173',
          pocketBaseUrl: 'http://127.0.0.1:8090',
          jitsiDomain: 'meet.example.test',
          supportUrl: '',
          updateUrl: '',
          accent: '#ffffff',
        }),
      })
    })

    await page.goto('/auth/reset')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f4f5f7')
    const colors = await page.locator('html').evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        emphasis: style.getPropertyValue('--accent-light').trim(),
        surface: style.getPropertyValue('--canvas').trim(),
      }
    })
    expect(contrastRatio(colors.emphasis, colors.surface)).toBeGreaterThanOrEqual(4.5)
  })

  test('mobile workspace controls remain visible and contrast-safe', async ({ page }) => {
    await mountWorkspaceControls(page)

    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Share screen' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Inbox' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mute channel notifications' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Channel settings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Member list' })).toBeVisible()

    const styles = await page.evaluate(() => {
      const nav = getComputedStyle(document.querySelector('.mobile-nav-button')!)
      const badge = getComputedStyle(document.querySelector('.action-badge')!)
      const message = getComputedStyle(document.querySelector('.message-list-item')!)
      return {
        nav: [nav.color, nav.backgroundColor] as const,
        badge: [badge.color, badge.backgroundColor] as const,
        messageContentVisibility: message.contentVisibility,
        fitsViewport: document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      }
    })
    expect(contrastRatio(...styles.nav)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(...styles.badge)).toBeGreaterThanOrEqual(4.5)
    expect(styles.messageContentVisibility).toBe('auto')
    expect(styles.fitsViewport).toBe(true)
  })

  test('production messages expose log and reaction state semantics', async ({ page }) => {
    await mountWorkspaceControls(page)

    await expect(page.getByRole('log', { name: 'Messages' })).toBeVisible()
    const reaction = page.getByRole('button', {
      name: 'Remove 👍 reaction, 1 reaction',
    })
    await expect(reaction).toHaveAttribute('aria-pressed', 'true')
  })

  test('context actions restore focus after keyboard activation', async ({ page }) => {
    await mountWorkspaceControls(page)

    const trigger = page.getByRole('button', { name: 'Open context actions' })
    await trigger.focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('button', { name: 'Mute', exact: true })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(trigger).toBeFocused()
  })

  test('member actions render inside the mobile drawer top layer', async ({ page }) => {
    await mountWorkspaceControls(page)

    await page.getByRole('button', { name: 'Open members context test' }).click()
    const memberDialog = page.getByRole('dialog', { name: 'Member list context test' })
    await expect(memberDialog).toBeVisible()

    const trigger = page.getByRole('button', { name: 'More actions for test member' })
    await trigger.click()
    const menu = page.getByRole('dialog', { name: 'Actions for test member' })
    await expect(menu).toBeVisible()
    await expect(page.getByRole('button', { name: 'Message', exact: true })).toBeFocused()

    const placement = await menu.evaluate((element) => {
      const menuBounds = element.getBoundingClientRect()
      const dialog = element.closest('dialog')
      const dialogBounds = dialog?.getBoundingClientRect()
      return {
        hostedByDialog: Boolean(dialog),
        insideHorizontalBounds: Boolean(
          dialogBounds
          && menuBounds.left >= dialogBounds.left
          && menuBounds.right <= dialogBounds.right
        ),
        insideVerticalBounds: Boolean(
          dialogBounds
          && menuBounds.top >= dialogBounds.top
          && menuBounds.bottom <= dialogBounds.bottom
        ),
      }
    })
    expect(placement).toEqual({
      hostedByDialog: true,
      insideHorizontalBounds: true,
      insideVerticalBounds: true,
    })
  })

  test('screen sharing remains reachable at the intermediate breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 700 })
    await mountWorkspaceControls(page)

    await expect(page.getByRole('button', { name: 'Inbox' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Share screen' })).toBeVisible()
    await expect(page.locator('.voice-controls')).toHaveCSS('overflow-x', 'auto')
  })

  test('compact member drawer remains visible while the grid panel yields', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 700 })
    await mountWorkspaceControls(page)
    await page.locator('#root').evaluate((root) => {
      const grid = root.querySelector('.app-grid')
      grid?.insertAdjacentHTML(
        'beforeend',
        '<aside class="members-panel" aria-label="Grid members">Grid members</aside>',
      )
      root.insertAdjacentHTML(
        'beforeend',
        '<dialog class="members-panel-dialog" aria-label="Member list" open><aside class="members-panel" aria-label="Drawer members">Drawer members</aside></dialog>',
      )
    })

    await expect(page.getByLabel('Grid members')).toBeHidden()
    await expect(page.getByLabel('Drawer members')).toBeVisible()
  })
})
