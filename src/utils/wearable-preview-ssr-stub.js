// SSR stub for WearablePreview component to avoid window access during server-side rendering
module.exports = {
  WearablePreview: function WearablePreviewStub() {
    // Return null during SSR - the real component will be loaded client-side
    return null
  },
}
