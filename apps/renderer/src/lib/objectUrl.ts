export function createDisposableObjectUrl(blob: Blob) {
  // The returned disposer closes over and revokes this exact URL.
  // oxlint-disable-next-line react-doctor/no-create-object-url-without-revoke
  const url = URL.createObjectURL(blob)
  return {
    url,
    revoke: () => URL.revokeObjectURL(url),
  }
}
