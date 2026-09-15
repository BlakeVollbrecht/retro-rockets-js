# RetroRockets

A browser remake of **RetroRockets**, a 2010 Xbox 360 indie game I wrote in C# with the XNA framework.

The game objective is to land a spacecraft as gently as possible and on as level ground as possible with as much fuel remaining as possible.
 
This port keeps the same physics, pixel collision, graphic/audio/font assets, but runs as a static HTML5 canvas page.

## Play

From this directory:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080/](http://localhost:8080/) in a browser.

High scores are stored in the browser (`localStorage`). Sound starts on the first click or key press (browser autoplay rule); a controller button does not count, so click the page once if you play with a pad only. The start menu shows a hint until sound is on.

## Xbox controller

Playing with an Xbox controller is recommended for variable thrust control with the triggers.

The game uses the standard [Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API): There was an intermittent issue with the gamepad turning off when the game is open (in Chrome specifically). This was resolved but not with full confidence. If you see the issue, one option is to use Edge browser in Windows which seems to have better support for Xbox controllers.

