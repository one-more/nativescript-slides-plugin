## Example Usage:

### XML

```xml

	<Slides:SlideContainer id="slides" pageIndicators="true">
			<Slides:Slide class="slide-1">
				<Label text="This is Panel 1"  />
			</Slides:Slide>
			<Slides:Slide class="slide-2">
				<Label text="This is Panel 2"  />
			</Slides:Slide>
			<Slides:Slide class="slide-3">
				<Label text="This is Panel 3"  />
			</Slides:Slide>
			<Slides:Slide class="slide-4">
				<Label text="This is Panel 4"  />
			</Slides:Slide>
			<Slides:Slide class="slide-5">
				<Label text="This is Panel 5"  />
			</Slides:Slide>
	</Slides:SlideContainer>

```

### CSS

```css
.slide-1 {
  background-color: darkslateblue;
}

.slide-2 {
  background-color: darkcyan;
}
.slide-3 {
  background-color: darkgreen;
}

.slide-4 {
  background-color: darkgoldenrod;
}
.slide-5 {
  background-color: darkslategray;
}
label {
  text-align: center;
  width: 100%;
  font-size: 35;
  margin-top: 35;
}
```

Great for Intros/Tutorials to Image Carousels.

To use the intro slide plugin you need to first import it into your xml layout with `xmlns:Slides="nativescript-slides"`

when using the intro slide plugin you need at least two `<Slides:Slide>` views inside of the `<Slides:SlideContainer>`.

add as many `<Slides:Slide>` as you want.

### Methods for SlideContainer

- **nextSlide()** - navigate to the next slide (right direction)
- **previousSlide()** - navigate to the previous slide (left direction)
- **goToSlide(index)** : - goes to the slide at the specified index

### Attributes for SlideContainer

- **loop : boolean** - If true will cause the slide to be an endless loop. The suggested use case would be for a Image Carousel or something of that nature.

- **disablePan : boolean** - If true panning is disabled. So that you can call nextSlide()/previousSlide() functions to change the slide. If slides is used to get details about users like email, phone number, username etc. in this case you don't want users to move from one slide to another slide without filling details.

- **pagerOffset : string** - Margin-top for the pager. Number or percentage, default 88%.

- **pageIndicators : boolean** - If true adds indicator dots to the bottom of your slides.

- \*\*slideWidth: number - set the width of your slides. (Only currently works on android).

#### Indicators

If the property `pageIndicators` is `true` you won't see the page indicators anymore as of 2.0.0 right away. there are two css classes exposed that you can setup however you like for active and inactive indicators. below is an example for semi translucent dots.

```css
.slide-indicator-inactive {
  background-color: #fff;
  opacity: 0.4;
  width: 10;
  height: 10;
  margin-left: 2.5;
  margin-right: 2.5;
  margin-top: 0;
  border-radius: 5;
}

.slide-indicator-active {
  background-color: #fff;
  opacity: 0.9;
  width: 10;
  height: 10;
  margin-left: 2.5;
  margin-right: 2.5;
  margin-top: 0;
  border-radius: 5;
}
```

#### Events

- **start** - Start pan
- **changed** - Transition complete
- **cancelled** - User didn't complete the transition, or at start\end with no slides
- **finished** - Last slide has come into view