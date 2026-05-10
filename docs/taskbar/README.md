# Taskbar Assets

Use this folder for custom XP-style taskbar sprites.

Start button sprite target:

```text
public/taskbar/start-button/start-button.png
```

Recommended dimensions:

```text
224 x 72
```

The app displays the start button at about `112 x 36` CSS pixels, so `224 x 72` gives a crisp 2x source for high-density screens. Keep the readable icon/text centered inside the full frame.

If you prefer a smaller 1x source, `112 x 36` also works.

Taskbar hide button sprite target:

```text
public/taskbar/hide-button/hide-button.png
```

Recommended dimensions:

```text
64 x 64
```

The app displays this around `18 x 18` to `34 x 34` CSS pixels depending on whether it is inside the taskbar or acting as the restore tab.
