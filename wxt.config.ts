import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  outDir: '.output',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Auto-close tabs',
    version: '1.0.1',
    description: 'Manage a list of URLs that are safe to close and close matching tabs on demand',
    permissions: ['storage', 'tabs', 'bookmarks', 'favicon', 'windows'],
    browser_specific_settings: {
      gecko: {
        id: 'autoclose@dannyhope.co.uk',
        strict_min_version: '109.0'
      }
    },
    icons: {
      16: '/icons/icon-16.png',
      48: '/icons/icon-48.png',
      128: '/icons/icon-128.png'
    }
  },
  runner: {
    disabled: true
  },
  zip: {
    artifactTemplate: '{{name}}-{{browser}}-{{version}}.zip'
  },
  suppressWarnings: {
    firefoxDataCollection: true
  }
});
