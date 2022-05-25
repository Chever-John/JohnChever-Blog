// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "CheverJohn's Website",
  tagline: 'One day docusaurus found me, then this website appeared!',
  url: 'http://localhost:3000/',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/landscape_ico.ico',
  organizationName: 'https://github.com/chever-john/', // Usually your GitHub org/user name.
  projectName: 'Blog', // Usually your repo name.

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        gtag: {
          trackingID: 'G-JSXD1Z95YL',
          anonymizeIP: true,
        },
      },
    ],
  ],
  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "CheverJohn's Website",
        logo: {
          alt: 'My Site Logo',
          src: 'img/landscape.jpg',
        },
        items: [
          {to: '/blog', label: 'Blog', position: 'right'},
          {to: '/blog/tags/', label:"Blog'sTag", position: 'right'},
          {
            href: 'https://github.com/chever-john/',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/users/11905409/cheverjohn',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/JohnChever',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/chever-john/',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
            ],
          },
          {
            title: "Friends' links",
            items: [
              {
                label: 'Skye Young',
                href: 'https://blog.syis.me/',
              },
              {
                "label": "北松山(itwaix)",
                "href": "https://www.itwaix.com/"
              }
            ]
          }
        ],
        copyright: `Copyright © ${new Date().getFullYear()} CheverJohn, Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
