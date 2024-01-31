# Normal picker - Custom element

A web component for picking normals represented as colors.

## Usage

Add the file to your project and.

```html
<normal-picker></normal-picker>
```

The updated values will be as an attribute on the element e.g.

```html
<normal-picker value="#8080ff"></normal-picker>
```

and can also be delivered as an event

```javascript
document
  .querySelector("normal-picker")
  .addEventListener("colorChange", (event) => {
    console.log("Selected color:", event.detail.color);
  });
```

The default value is the vector `(0,0,1)` seen as point upwards in the normal map. The formula for converting the cartesian vector to RGB space is

```
rgb = (xyz + 1) * 255/2
```
