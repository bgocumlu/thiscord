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
    await page.goto('/auth/reset?token=test-reset-token')

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
    await page.goto('/auth/reset?token=test-reset-token')
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

    await page.goto('/auth/reset?token=test-reset-token')
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
    await expect(page.getByRole('button', { name: 'Share screen' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Inbox' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Help and tips' })).toBeVisible()
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

  test('mobile Enter adds lines and the send button submits the message', async ({ page }) => {
    await mountWorkspaceControls(page)

    const composer = page.getByRole('textbox', { name: 'Message #general' })
    await composer.fill('First line')
    await composer.press('Enter')
    await composer.type('Second line')
    await expect(composer).toHaveValue('First line\nSecond line')

    await page.getByRole('button', { name: 'Send' }).click()
    await expect(composer).toHaveValue('')
  })

  test('desktop composer grows for multiline drafts and Enter sends', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 700 })
    await mountWorkspaceControls(page)

    const composer = page.getByRole('textbox', { name: 'Message #general' })
    const singleLineHeight = await composer.evaluate((element) => element.getBoundingClientRect().height)
    await composer.fill('First line')
    await composer.press('Shift+Enter')
    await composer.type('Second line')
    await expect(composer).toHaveValue('First line\nSecond line')
    const multilineHeight = await composer.evaluate((element) => element.getBoundingClientRect().height)
    expect(multilineHeight).toBeGreaterThan(singleLineHeight)

    await composer.press('Enter')
    await expect(composer).toHaveValue('')
  })

  test('rendered message text preserves authored line breaks', async ({ page }) => {
    await mountWorkspaceControls(page)

    await expect(page.locator('.message-content p')).toHaveCSS('white-space', 'pre-wrap')
  })

  test('non-square avatar images remain fixed square crops', async ({ page }) => {
    await mountWorkspaceControls(page)

    const geometry = await page.evaluate(async () => {
      const avatar = document.createElement('span')
      avatar.className = 'avatar avatar-medium'
      const image = document.createElement('img')
      image.alt = ''
      image.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="120"/>'
      avatar.append(image)
      document.body.append(avatar)
      await image.decode()
      const avatarRect = avatar.getBoundingClientRect()
      const imageRect = image.getBoundingClientRect()
      return {
        avatar: [avatarRect.width, avatarRect.height],
        image: [imageRect.width, imageRect.height],
        objectFit: getComputedStyle(image).objectFit,
      }
    })

    expect(geometry).toEqual({
      avatar: [34, 34],
      image: [34, 34],
      objectFit: 'cover',
    })
  })

  test('production messages expose log and reaction state semantics', async ({ page }) => {
    await mountWorkspaceControls(page)

    await expect(page.getByRole('log', { name: 'Messages' })).toBeVisible()
    const reaction = page.getByRole('button', {
      name: 'Remove 👍 reaction, 1 reaction',
    })
    await expect(reaction).toHaveAttribute('aria-pressed', 'true')
  })

  test('message avatars open the author profile', async ({ page }) => {
    await mountWorkspaceControls(page)

    await page.getByRole('button', { name: "View Berkay's profile" }).click()
    await expect(page.getByLabel('Opened profile')).toHaveText('Berkay')
  })

  test('mobile workspace help exposes touch guidance and explicit dismissal', async ({ page }) => {
    await mountWorkspaceControls(page)

    const trigger = page.getByRole('button', { name: 'Help and tips' })
    await trigger.click()
    const help = page.getByRole('region', { name: 'Help and tips' })
    await expect(help).toBeVisible()
    await expect(help.getByText('Mobile tips')).toBeVisible()
    await expect(help.getByText('Press and hold a message')).toBeVisible()
    await expect(help.getByText('Search this conversation')).toBeHidden()
    await help.getByRole('button', { name: 'Close help' }).click()
    await expect(help).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('desktop workspace help retains keyboard shortcuts', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 700 })
    await mountWorkspaceControls(page)

    await page.getByRole('button', { name: 'Help and tips' }).click()
    const help = page.getByRole('region', { name: 'Help and tips' })
    await expect(help.getByText('Keyboard shortcuts')).toBeVisible()
    await expect(help.getByText('Search this conversation')).toBeVisible()
    await expect(help.getByText('Mobile tips')).toBeHidden()
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

  test('an incomplete recovery link blocks unusable password entry', async ({ page }) => {
    await page.goto('/auth/reset')

    await expect(page.getByRole('heading', { name: 'Reset link unavailable' })).toBeVisible()
    await expect(page.getByLabel('New password')).toHaveCount(0)
    await page.getByRole('button', { name: 'Request a new reset link' }).click()
    await expect(page.getByRole('heading', { name: 'Reset password' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeFocused()
  })
})

test.describe('coarse pointer message actions', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  })

  test('message overflow stays visible and protects deletion with confirmation', async ({ page }) => {
    await page.goto('/auth/reset?renderer-test=workspace-controls')
    await expect(page.locator('[data-renderer-test-ready="true"]')).toBeVisible()

    const more = page.getByRole('button', { name: 'More actions for message from Berkay' })
    await expect(more).toBeVisible()
    await more.click()

    const actions = page.getByRole('dialog', { name: 'Actions for message from Berkay' })
    await expect(actions).toBeVisible()
    await expect(actions.getByRole('button', { name: 'Reply' })).toBeVisible()
    await actions.getByRole('button', { name: 'Delete message' }).click()

    const confirmation = page.getByRole('dialog', { name: 'Delete message?' })
    await expect(confirmation).toBeVisible()
    await expect(confirmation.getByRole('button', { name: 'Delete message', exact: true })).toBeVisible()
    await confirmation.getByRole('button', { name: 'Cancel' }).click()
    await expect(confirmation).toBeHidden()
  })

  test('message more actions copy the complete message text', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/auth/reset?renderer-test=workspace-controls')
    await expect(page.locator('[data-renderer-test-ready="true"]')).toBeVisible()

    await page.getByRole('button', { name: 'More actions for message from Berkay' }).click()
    const actions = page.getByRole('dialog', { name: 'Actions for message from Berkay' })
    await actions.getByRole('button', { name: 'Copy text' }).click()

    await expect(page.getByRole('status')).toHaveText('Message text copied.')
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('A retained production message row')
  })

  test('single-line mobile composer controls share one vertical center', async ({ page }) => {
    await page.goto('/auth/reset?renderer-test=workspace-controls')
    await expect(page.locator('[data-renderer-test-ready="true"]')).toBeVisible()

    const geometry = await page.locator('.composer').evaluate((composer) => (
      [...composer.querySelectorAll('button, textarea')].map((control) => {
        const bounds = control.getBoundingClientRect()
        return {
          height: bounds.height,
          center: bounds.top + bounds.height / 2,
        }
      })
    ))
    const centers = geometry.map(({ center }) => center)

    expect(geometry.every(({ height }) => height === 44)).toBe(true)
    expect(Math.max(...centers) - Math.min(...centers)).toBeLessThanOrEqual(0.5)
  })
})
