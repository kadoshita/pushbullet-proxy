# pushbullet-proxy

PushbulletのWebAPIを叩いてテキストなどを送信するプログラム

# 使い方
## テキストを送る
```sh
$ curl -X POST -H 'Content-Type:application/json' http://localhost:3000/ -d '{"body":"test text","title":"test"}'
```

## URLを送る
```sh
$ curl -X POST -H 'Content-Type:application/json' http://localhost:3000/ -d '{"url":"http://example.com"}'
```

## ファイルを送る
```sh
$ curl -X POST -F file=@example.png http://localhost:3000/file
```
