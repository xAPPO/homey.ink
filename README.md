# Homey.ink

Homey.ink is an open-source project for wall-mounted Homey dashboards.
This fork is primarily aimed at usage on an Raspberry pi or Iphone X

![Homey.ink on Raspberry pi](https://raw.githubusercontent.com/Homeycornelisse/homey.ink/master/assets/devices/Raspberry/Raspberry.png)
![Homey.ink on Raspberry pi](https://raw.githubusercontent.com/Homeycornelisse/homey.ink/master/assets/devices/Raspberry/iphonex.png)
![Homey.ink on Raspberry pi](https://raw.githubusercontent.com/Homeycornelisse/homey.ink/master/assets/devices/Raspberry/iphone.png)


To run this locally:

```
npm i -g serve
git clone https://github.com/daneedk/homey.ink
cd homey.ink
serve -p 5000 app
```

(Or host it on your own favorite webserver, doing so may need changes to the source you need to do yourself.)

Then visit `http://localhost:5000/?theme=web&lang=en&token=<TOKEN>`

or `http://localhost:5000/?theme=iphone&lang=en&token=<TOKEN>`

Homey.ink is available in German (de), English (en), French (fr), Dutch (nl), Norwegian (no) and Swedish (sv)

> Your token can be acquired by visiting https://homey.ink and looking in the console after logging in.
