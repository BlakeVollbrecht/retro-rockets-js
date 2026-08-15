# RetroRockets

A browser remake of **RetroRockets**, a 2010 Xbox 360 indie game I wrote in C# with the XNA framework.

The game objective is to land a spacecraft as gently as possible and on as level ground as possible with as much fuel remaining as possible.
 
This port keeps the same physics, pixel collision, graphic/audio/font assets, but runs as a static HTML5 canvas page.

## Play

From this directory:

```bash
python3 -m http.server 8080
```

Then open [http://localhost:8080/](http://localhost:8080/) in Chrome.

Playing with an Xbox controller is recommended for variable thrust control with the triggers

High scores are stored in the browser (`localStorage`). Sound may stay silent until the page gets a click or key; that is a browser autoplay rule, not the original game.
