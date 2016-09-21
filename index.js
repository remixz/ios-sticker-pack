const fs = require('fs')
const path = require('path')
const exec = require('child_process').exec
const ncp = require('ncp')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const async = require('neo-async')
const mustache = require('mustache')
const glob = require('glob')
const bytes = require('bytes')
const open = require('opn')

function createApp (opts, cb) {
  const templatePath = path.resolve(__dirname, 'template/App')
  const appPath = path.resolve(process.cwd(), 'App')
  const bundleName = (opts.bundleName || path.basename(process.cwd())).replace(/ /g, '-')
  const displayName = opts.displayName || path.basename(process.cwd())
  const identifier = opts.identifier || `com.example.${bundleName.toLowerCase()}`

  if (fs.existsSync(appPath)) {
    return rimraf(`${appPath}/StickerPackExtension/Stickers.xcstickers`, (err) => {
      if (err) return cb(err)

      ncp(`${templatePath}/StickerPackExtension/Stickers.xcstickers`, `${appPath}/StickerPackExtension/Stickers.xcstickers`, (err) => {
        if (err) return cb(err)

        cb()
      })
    })
  }

  ncp(templatePath, appPath, (err) => {
    if (err) return cb(err)

    async.parallel([
      (cb) => fs.rename(`${appPath}/__APP_NAME__`, `${appPath}/${bundleName}`, cb),
      (cb) => fs.rename(`${appPath}/__APP_NAME__.xcodeproj`, `${appPath}/${bundleName}.xcodeproj`, cb)
    ], (err) => {
      if (err) return cb(err)

      const templateOptions = { bundleName, displayName, identifier }
      async.each([
        `${appPath}/${bundleName}/Info.plist`,
        `${appPath}/${bundleName}.xcodeproj/project.pbxproj`,
        `${appPath}/${bundleName}.xcodeproj/project.xcworkspace/contents.xcworkspacedata`,
        `${appPath}/StickerPackExtension/Info.plist`
      ], (file, cb) => {
        fs.readFile(file, (err, buf) => {
          if (err) return cb(err)

          const rendered = mustache.render(buf.toString(), templateOptions)
          fs.writeFile(file, rendered, cb)
        })
      }, (err) => {
        if (err) return cb(err)

        console.log(`⚠️  Okay, one last thing: You need to provision your app in Xcode. I've opened Xcode for you, here's what you need to do:`)
        console.log(`  1. Choose on your project in the sidebar on the left (don't expand it, just click)`)
        console.log(`  2. In the dropdown that says "Unknown Team (__TEAM__)", change it to your personal team.`)
        console.log(`  3. Quit Xcode (not just close the window), and this wizard will continue.`)
        console.log(`You only need to do this once. Sorry for the inconvenience!`)
        open(`${appPath}/${bundleName}.xcodeproj`).then(() => {
          fs.readFile(`${appPath}/${bundleName}.xcodeproj/project.pbxproj`, (err, buf) => {
            if (err) return cb(err)

            const str = buf.toString()
            const id = (/DevelopmentTeam = (\w+)/gi).exec(str)[1]
            const final = buf.toString().replace(/__TEAM__/g, id)
            fs.writeFile(`${appPath}/${bundleName}.xcodeproj/project.pbxproj`, final, cb)
          })
        })
      })
    })
  })
}

function addImages (cb) {
  const stickersPath = path.resolve(process.cwd(), 'App/StickerPackExtension/Stickers.xcstickers/Sticker Pack.stickerpack')
  const stickersConfig = require(`${stickersPath}/Contents.json`)

  if (!stickersConfig.stickers) {
    stickersConfig.stickers = []
  }

  glob('*.+(png|gif|jpg|jpeg)', (err, files) => {
    if (err) return cb(err)

    async.each(files, (file, cb) => {
      const fileStats = fs.statSync(file)
      if (fileStats.size > 512000) {
        console.log(`⚠️  ${file} is too big (${bytes(fileStats.size)}), must be 500kb or less -- skipping`)
        return cb()
      }
      const fileBaseName = path.basename(file, path.extname(file))
      stickersConfig.stickers.push({
        filename: `${fileBaseName}.sticker`
      })

      const stickerImagePath = path.resolve(process.cwd(), file)
      const stickerFolder = `${stickersPath}/${fileBaseName}.sticker`
      mkdirp(stickerFolder, (err) => {
        if (err) return cb(err)

        ncp(stickerImagePath, `${stickerFolder}/${file}`, (err) => {
          if (err) return cb(err)

          const stickerConfig = {
            info: {
              version: 1,
              author: 'xcode'
            },
            properties: {
              filename: file
            }
          }

          fs.writeFile(`${stickerFolder}/Contents.json`, JSON.stringify(stickerConfig), cb)
        })
      })
    }, (err) => {
      if (err) return cb(err)

      fs.writeFile(`${stickersPath}/Contents.json`, JSON.stringify(stickersConfig), cb)
    })
  })
}

module.exports = {
  create (opts) {
    createApp(opts, (err) => {
      if (err) throw err

      addImages((err) => {
        if (err) throw err

        console.log('✅  Sticker pack created! Install to your device with `ios-sticker-pack deploy`')
      })
    })
  },

  deploy (opts) {
    console.log('🕒  Building sticker pack...')
    glob('App/*.xcodeproj', (err, files) => {
      if (err) throw err
      if (files.length === 0) {
        console.log('❌  Couldn\'t find Xcode project -- have you created the sticker pack with `ios-sticker-pack create` yet?')
        process.exit(1)
      }

      rimraf('App/build', (err) => {
        if (err) throw err

        exec(`xcodebuild -project ${files[0]}`, (err) => {
          if (err) throw err

          console.log('🕓  Installing sticker pack... Make sure your device is connected!')
          glob('App/build/Release-iphoneos/*.app', (err, files) => {
            if (err) throw err

            exec(`${__dirname}/node_modules/.bin/ios-deploy --uninstall --bundle ${files[0]}`, (err) => {
              if (err) throw err

              console.log('✅  Installed! Open iMessage to test out your sticker pack.')
              console.log('⚠️  Stickers not working? You likely need to tell your device to trust your developer certificate. See https://github.com/remixz/ios-sticker-pack#not-working for details how.')
            })
          })
        })
      })
    })
  }
}
