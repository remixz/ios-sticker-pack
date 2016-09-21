# ios-sticker-pack

## oh no, might be broken right now!! see: https://github.com/remixz/ios-sticker-pack/issues/1

Create and install iMessage sticker packs from the command line. Stickers and adhesive not included.

![demo of ios-sticker-pack](https://d3vv6lp55qjaqc.cloudfront.net/items/363S193T0x3G1Z3O3Z0v/stickademo.gif?X-CloudApp-Visitor-Id=1635062&v=a21e014b)

## Installation

`ios-sticker-pack` only works on macOS, due to the requirement of Xcode. Xcode 8.0+ is required.

```bash
npm install ios-sticker-pack -g
```

## Tutorial

After installing `ios-sticker-pack` with the instructions above, create a new folder somewhere. The name of the folder will be the name of the sticker pack on your device. Put any images you want to use as stickers in this new folder. They can be PNGs, GIFs (including animated!), or JPEGs. The only limitation is that they must be under 500kb. Once you've added all your images, run the following command inside that folder:

```
ios-sticker-pack create
```

This will create a sticker pack with the images in the current folder. Whenever you add, remove, or update images, just run that command again, and it'll update the app. To install your sticker pack to your device, just run:

```
ios-sticker-pack deploy
```

And it'll automatically install it to your device. Congrats! You've made and installed a sticker pack with just two commands. :smile:

## Not working?

When you install a sticker pack for the first time, you'll likely need to trust your development certificate on your device. To do this, go to **Settings** -> **General** -> **Device Management** -> **Your iCloud account**, and press the **Trust** button. You should only have to do this once. If you still are having issues, [please file an issue](https://github.com/remixz/ios-sticker-pack/issues/new)!

## Usage

```
Usage: ios-sticker-pack <command> [options]

Commands:
  create  Creates a sticker pack app using the images inside the current folder
          (must be .png, .gif, or .jpg)
  deploy  Deploys the sticker pack to the connected device

Options:
  -h, --help     Show help                                             [boolean]
  -v, --version  Show version number                                   [boolean]
```
