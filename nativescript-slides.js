"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('nativescript-dom');
var app = require("tns-core-modules/application");
var Platform = require("tns-core-modules/platform");
var absolute_layout_1 = require("tns-core-modules/ui/layouts/absolute-layout");
var stack_layout_1 = require("tns-core-modules/ui/layouts/stack-layout");
var button_1 = require("tns-core-modules/ui/button");
var label_1 = require("tns-core-modules/ui/label");
var AnimationModule = require("tns-core-modules/ui/animation");
var gestures = require("tns-core-modules/ui/gestures");
var enums_1 = require("tns-core-modules/ui/enums");
var SLIDE_INDICATOR_INACTIVE = 'slide-indicator-inactive';
var SLIDE_INDICATOR_ACTIVE = 'slide-indicator-active';
var SLIDE_INDICATOR_WRAP = 'slide-indicator-wrap';
var LayoutParams;
if (app.android) {
    LayoutParams = android.view.WindowManager.LayoutParams;
}
else {
    LayoutParams = {};
}
var Slide = /** @class */ (function (_super) {
    __extends(Slide, _super);
    function Slide() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Slide;
}(stack_layout_1.StackLayout));
exports.Slide = Slide;
var direction;
(function (direction) {
    direction[direction["none"] = 0] = "none";
    direction[direction["left"] = 1] = "left";
    direction[direction["right"] = 2] = "right";
})(direction || (direction = {}));
var cancellationReason;
(function (cancellationReason) {
    cancellationReason[cancellationReason["user"] = 0] = "user";
    cancellationReason[cancellationReason["noPrevSlides"] = 1] = "noPrevSlides";
    cancellationReason[cancellationReason["noMoreSlides"] = 2] = "noMoreSlides";
})(cancellationReason || (cancellationReason = {}));
var SlideContainer = /** @class */ (function (_super) {
    __extends(SlideContainer, _super);
    function SlideContainer() {
        var _this = _super.call(this) || this;
        _this.transitioning = false;
        _this.direction = direction.none;
        _this.setupDefaultValues();
        // if being used in an ng2 app we want to prevent it from excuting the constructView
        // until it is called manually in ngAfterViewInit.
        _this.constructView(true);
        return _this;
    }
    Object.defineProperty(SlideContainer.prototype, "pageIndicators", {
        /* page indicator stuff*/
        get: function () {
            return this._pageIndicators;
        },
        set: function (value) {
            if (typeof value === 'string') {
                value = value == 'true';
            }
            this._pageIndicators = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SlideContainer.prototype, "pagerOffset", {
        get: function () {
            return this._pagerOffset;
        },
        set: function (value) {
            this._pagerOffset = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SlideContainer.prototype, "hasNext", {
        get: function () {
            return !!this.currentPanel && !!this.currentPanel.right;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SlideContainer.prototype, "hasPrevious", {
        get: function () {
            return !!this.currentPanel && !!this.currentPanel.left;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SlideContainer.prototype, "loop", {
        get: function () {
            return this._loop;
        },
        set: function (value) {
            this._loop = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SlideContainer.prototype, "disablePan", {
        get: function () {
            return this._disablePan;
        },
        set: function (value) {
            if (this._disablePan === value) {
                return;
            } // Value did not change
            this._disablePan = value;
            if (this._loaded && this.currentPanel.panel !== undefined) {
                if (value === true) {
                    this.currentPanel.panel.off('pan');
                }
                else if (value === false) {
                    this.applySwipe(this.pageWidth);
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SlideContainer.prototype, "pageWidth", {
        get: function () {
            if (!this.slideWidth) {
                return Platform.screen.mainScreen.widthDIPs;
            }
            return +this.slideWidth;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SlideContainer.prototype, "angular", {
        get: function () {
            return this._angular;
        },
        set: function (value) {
            this._angular = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SlideContainer.prototype, "currentIndex", {
        get: function () {
            return this.currentPanel.index;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SlideContainer.prototype, "slideWidth", {
        get: function () {
            return this._slideWidth;
        },
        set: function (width) {
            this._slideWidth = width;
        },
        enumerable: true,
        configurable: true
    });
    SlideContainer.prototype.setupDefaultValues = function () {
        this.clipToBounds = true;
        this._loaded = false;
        if (this._loop == null) {
            this.loop = false;
        }
        this.transitioning = false;
        if (this._disablePan == null) {
            this.disablePan = false;
        }
        if (this._angular == null) {
            this.angular = false;
        }
        if (this._pageIndicators == null) {
            this._pageIndicators = false;
        }
        if (this._pagerOffset == null) {
            this._pagerOffset = '88%'; //defaults to white.
        }
    };
    SlideContainer.prototype.constructView = function (constructor) {
        var _this = this;
        if (constructor === void 0) { constructor = false; }
        this.on(absolute_layout_1.AbsoluteLayout.loadedEvent, function (data) {
            //// console.log('LOADDED EVENT');
            if (!_this._loaded) {
                _this._loaded = true;
                if (_this.angular === true && constructor === true) {
                    return;
                }
                var slides_1 = [];
                if (!_this.slideWidth) {
                    _this.slideWidth = _this.pageWidth;
                }
                _this.width = +_this.slideWidth;
                _this.eachLayoutChild(function (view) {
                    if (view instanceof stack_layout_1.StackLayout) {
                        absolute_layout_1.AbsoluteLayout.setLeft(view, _this.pageWidth);
                        view.width = _this.pageWidth;
                        view.height = '100%'; //get around compiler
                        slides_1.push(view);
                    }
                });
                if (_this.pageIndicators) {
                    _this._footer = _this.buildFooter(slides_1.length, 0);
                    _this.setActivePageIndicator(0);
                    _this.insertChild(_this._footer, _this.getChildrenCount());
                }
                _this.currentPanel = _this.buildSlideMap(slides_1);
                if (_this.currentPanel) {
                    _this.positionPanels(_this.currentPanel);
                    if (_this.disablePan === false) {
                        _this.applySwipe(_this.pageWidth);
                    }
                    if (app.ios) {
                        _this.ios.clipsToBound = true;
                    }
                    //handles application orientation change
                    app.on(app.orientationChangedEvent, function (args) {
                        //event and page orientation didn't seem to alwasy be on the same page so setting it in the time out addresses this.
                        setTimeout(function () {
                            // console.log('orientationChangedEvent');
                            _this.width = parseInt(_this.slideWidth);
                            _this.eachLayoutChild(function (view) {
                                if (view instanceof stack_layout_1.StackLayout) {
                                    absolute_layout_1.AbsoluteLayout.setLeft(view, _this.pageWidth);
                                    view.width = _this.pageWidth;
                                }
                            });
                            if (_this.disablePan === false) {
                                _this.applySwipe(_this.pageWidth);
                            }
                            if (_this.pageIndicators) {
                                absolute_layout_1.AbsoluteLayout.setTop(_this._footer, 0);
                                var pageIndicatorsLeftOffset = _this.pageWidth / 4;
                                absolute_layout_1.AbsoluteLayout.setLeft(_this._footer, pageIndicatorsLeftOffset);
                                _this._footer.width = _this.pageWidth / 2;
                                _this._footer.marginTop = _this._pagerOffset;
                            }
                            _this.positionPanels(_this.currentPanel);
                        }, 0);
                    });
                }
            }
        });
    };
    SlideContainer.prototype.nextSlide = function () {
        var _this = this;
        if (!this.hasNext) {
            this.triggerCancelEvent(cancellationReason.noMoreSlides);
            return;
        }
        this.direction = direction.left;
        this.transitioning = true;
        this.triggerStartEvent();
        this.showRightSlide(this.currentPanel).then(function () {
            _this.setupPanel(_this.currentPanel.right);
            _this.triggerChangeEventRightToLeft();
        });
    };
    SlideContainer.prototype.previousSlide = function () {
        var _this = this;
        if (!this.hasPrevious) {
            this.triggerCancelEvent(cancellationReason.noPrevSlides);
            return;
        }
        this.direction = direction.right;
        this.transitioning = true;
        this.triggerStartEvent();
        this.showLeftSlide(this.currentPanel).then(function () {
            _this.setupPanel(_this.currentPanel.left);
            _this.triggerChangeEventLeftToRight();
        });
    };
    SlideContainer.prototype.setupPanel = function (panel) {
        this.direction = direction.none;
        this.transitioning = false;
        this.currentPanel.panel.off('pan');
        this.currentPanel = panel;
        // sets up each panel so that they are positioned to transition either way.
        this.positionPanels(this.currentPanel);
        if (this.disablePan === false) {
            this.applySwipe(this.pageWidth);
        }
        if (this.pageIndicators) {
            this.setActivePageIndicator(this.currentPanel.index);
        }
    };
    SlideContainer.prototype.positionPanels = function (panel) {
        // sets up each panel so that they are positioned to transition either way.
        if (panel.left != null) {
            panel.left.panel.translateX = -this.pageWidth * 2;
        }
        panel.panel.translateX = -this.pageWidth;
        if (panel.right != null) {
            panel.right.panel.translateX = 0;
        }
    };
    SlideContainer.prototype.goToSlide = function (index) {
        if (this._slideMap &&
            this._slideMap.length > 0 &&
            index < this._slideMap.length) {
            var previousSlide = this.currentPanel;
            this.setupPanel(this._slideMap[index]);
            this.notify({
                eventName: SlideContainer.changedEvent,
                object: this,
                eventData: {
                    direction: direction.none,
                    newIndex: this.currentPanel.index,
                    oldIndex: previousSlide.index
                }
            });
        }
        else {
            // console.log('invalid index');
        }
    };
    SlideContainer.prototype.applySwipe = function (pageWidth) {
        var _this = this;
        var previousDelta = -1; //hack to get around ios firing pan event after release
        var endingVelocity = 0;
        var startTime, deltaTime;
        this.currentPanel.panel.on('pan', function (args) {
            if (args.state === gestures.GestureStateTypes.began) {
                startTime = Date.now();
                previousDelta = 0;
                endingVelocity = 250;
                _this.triggerStartEvent();
            }
            else if (args.state === gestures.GestureStateTypes.ended) {
                deltaTime = Date.now() - startTime;
                // if velocityScrolling is enabled then calculate the velocitty
                // swiping left to right.
                if (args.deltaX > pageWidth / 3) {
                    if (_this.hasPrevious) {
                        _this.transitioning = true;
                        _this.showLeftSlide(_this.currentPanel, args.deltaX, endingVelocity).then(function () {
                            _this.setupPanel(_this.currentPanel.left);
                            _this.triggerChangeEventLeftToRight();
                        });
                    }
                    else {
                        //We're at the start
                        //Notify no more slides
                        _this.triggerCancelEvent(cancellationReason.noPrevSlides);
                    }
                    return;
                }
                // swiping right to left
                else if (args.deltaX < -pageWidth / 3) {
                    if (_this.hasNext) {
                        _this.transitioning = true;
                        _this.showRightSlide(_this.currentPanel, args.deltaX, endingVelocity).then(function () {
                            _this.setupPanel(_this.currentPanel.right);
                            // Notify changed
                            _this.triggerChangeEventRightToLeft();
                            if (!_this.hasNext) {
                                // Notify finsihed
                                _this.notify({
                                    eventName: SlideContainer.finishedEvent,
                                    object: _this
                                });
                            }
                        });
                    }
                    else {
                        // We're at the end
                        // Notify no more slides
                        _this.triggerCancelEvent(cancellationReason.noMoreSlides);
                    }
                    return;
                }
                if (_this.transitioning === false) {
                    //Notify cancelled
                    _this.triggerCancelEvent(cancellationReason.user);
                    _this.transitioning = true;
                    _this.currentPanel.panel.animate({
                        translate: { x: -_this.pageWidth, y: 0 },
                        duration: 200,
                        curve: enums_1.AnimationCurve.easeOut
                    });
                    if (_this.hasNext) {
                        _this.currentPanel.right.panel.animate({
                            translate: { x: 0, y: 0 },
                            duration: 200,
                            curve: enums_1.AnimationCurve.easeOut
                        });
                        if (app.ios)
                            //for some reason i have to set these in ios or there is some sort of bounce back.
                            _this.currentPanel.right.panel.translateX = 0;
                    }
                    if (_this.hasPrevious) {
                        _this.currentPanel.left.panel.animate({
                            translate: { x: -_this.pageWidth * 2, y: 0 },
                            duration: 200,
                            curve: enums_1.AnimationCurve.easeOut
                        });
                        if (app.ios)
                            _this.currentPanel.left.panel.translateX = -_this.pageWidth;
                    }
                    if (app.ios)
                        _this.currentPanel.panel.translateX = -_this.pageWidth;
                    _this.transitioning = false;
                }
            }
            else {
                if (!_this.transitioning &&
                    previousDelta !== args.deltaX &&
                    args.deltaX != null &&
                    args.deltaX < 0) {
                    if (_this.hasNext) {
                        _this.direction = direction.left;
                        _this.currentPanel.panel.translateX = args.deltaX - _this.pageWidth;
                        _this.currentPanel.right.panel.translateX = args.deltaX;
                    }
                }
                else if (!_this.transitioning &&
                    previousDelta !== args.deltaX &&
                    args.deltaX != null &&
                    args.deltaX > 0) {
                    if (_this.hasPrevious) {
                        _this.direction = direction.right;
                        _this.currentPanel.panel.translateX = args.deltaX - _this.pageWidth;
                        _this.currentPanel.left.panel.translateX =
                            -(_this.pageWidth * 2) + args.deltaX;
                    }
                }
                if (args.deltaX !== 0) {
                    previousDelta = args.deltaX;
                }
            }
        });
    };
    SlideContainer.prototype.showRightSlide = function (panelMap, offset, endingVelocity) {
        if (offset === void 0) { offset = this.pageWidth; }
        if (endingVelocity === void 0) { endingVelocity = 32; }
        var animationDuration;
        animationDuration = 300; // default value
        var transition = new Array();
        transition.push({
            target: panelMap.right.panel,
            translate: { x: -this.pageWidth, y: 0 },
            duration: animationDuration,
            curve: enums_1.AnimationCurve.easeOut
        });
        transition.push({
            target: panelMap.panel,
            translate: { x: -this.pageWidth * 2, y: 0 },
            duration: animationDuration,
            curve: enums_1.AnimationCurve.easeOut
        });
        var animationSet = new AnimationModule.Animation(transition, false);
        return animationSet.play();
    };
    SlideContainer.prototype.showLeftSlide = function (panelMap, offset, endingVelocity) {
        if (offset === void 0) { offset = this.pageWidth; }
        if (endingVelocity === void 0) { endingVelocity = 32; }
        var animationDuration;
        animationDuration = 300; // default value
        var transition = new Array();
        transition.push({
            target: panelMap.left.panel,
            translate: { x: -this.pageWidth, y: 0 },
            duration: animationDuration,
            curve: enums_1.AnimationCurve.easeOut
        });
        transition.push({
            target: panelMap.panel,
            translate: { x: 0, y: 0 },
            duration: animationDuration,
            curve: enums_1.AnimationCurve.easeOut
        });
        var animationSet = new AnimationModule.Animation(transition, false);
        return animationSet.play();
    };
    SlideContainer.prototype.buildFooter = function (pageCount, activeIndex) {
        if (pageCount === void 0) { pageCount = 5; }
        if (activeIndex === void 0) { activeIndex = 0; }
        var footerInnerWrap = new stack_layout_1.StackLayout();
        //footerInnerWrap.height = 50;
        if (app.ios) {
            footerInnerWrap.clipToBounds = false;
        }
        footerInnerWrap.className = SLIDE_INDICATOR_WRAP;
        absolute_layout_1.AbsoluteLayout.setTop(footerInnerWrap, 0);
        footerInnerWrap.orientation = 'horizontal';
        footerInnerWrap.horizontalAlignment = 'center';
        footerInnerWrap.width = this.pageWidth / 2;
        var index = 0;
        while (index < pageCount) {
            footerInnerWrap.addChild(this.createIndicator(index));
            index++;
        }
        var pageIndicatorsLeftOffset = this.pageWidth / 4;
        absolute_layout_1.AbsoluteLayout.setLeft(footerInnerWrap, pageIndicatorsLeftOffset);
        footerInnerWrap.marginTop = this._pagerOffset;
        return footerInnerWrap;
    };
    SlideContainer.prototype.setwidthPercent = function (view, percentage) {
        view.width = percentage + '%';
    };
    SlideContainer.prototype.newFooterButton = function (name) {
        var button = new button_1.Button();
        button.id = 'btn-info-' + name.toLowerCase();
        button.text = name;
        this.setwidthPercent(button, 100);
        return button;
    };
    SlideContainer.prototype.buildSlideMap = function (views) {
        var _this = this;
        this._slideMap = [];
        views.forEach(function (view, index) {
            _this._slideMap.push({
                panel: view,
                index: index
            });
        });
        this._slideMap.forEach(function (mapping, index) {
            if (_this._slideMap[index - 1] != null)
                mapping.left = _this._slideMap[index - 1];
            if (_this._slideMap[index + 1] != null)
                mapping.right = _this._slideMap[index + 1];
        });
        if (this.loop === true) {
            this._slideMap[0].left = this._slideMap[this._slideMap.length - 1];
            this._slideMap[this._slideMap.length - 1].right = this._slideMap[0];
        }
        return this._slideMap[0];
    };
    SlideContainer.prototype.triggerStartEvent = function () {
        this.notify({
            eventName: SlideContainer.startEvent,
            object: this,
            eventData: {
                currentIndex: this.currentPanel.index
            }
        });
    };
    SlideContainer.prototype.triggerChangeEventLeftToRight = function () {
        this.notify({
            eventName: SlideContainer.changedEvent,
            object: this,
            eventData: {
                direction: direction.left,
                newIndex: this.currentPanel.index,
                oldIndex: this.currentPanel.index + 1
            }
        });
    };
    SlideContainer.prototype.triggerChangeEventRightToLeft = function () {
        this.notify({
            eventName: SlideContainer.changedEvent,
            object: this,
            eventData: {
                direction: direction.right,
                newIndex: this.currentPanel.index,
                oldIndex: this.currentPanel.index - 1
            }
        });
    };
    SlideContainer.prototype.triggerCancelEvent = function (cancelReason) {
        this.notify({
            eventName: SlideContainer.cancelledEvent,
            object: this,
            eventData: {
                currentIndex: this.currentPanel.index,
                reason: cancelReason
            }
        });
    };
    SlideContainer.prototype.createIndicator = function (index) {
        var indicator = new label_1.Label();
        indicator.classList.add(SLIDE_INDICATOR_INACTIVE);
        return indicator;
    };
    SlideContainer.prototype.setActivePageIndicator = function (index) {
        var indicatorsToDeactivate = this._footer.getElementsByClassName(SLIDE_INDICATOR_ACTIVE);
        indicatorsToDeactivate.forEach(function (activeIndicator) {
            activeIndicator.classList.remove(SLIDE_INDICATOR_ACTIVE);
            activeIndicator.classList.add(SLIDE_INDICATOR_INACTIVE);
        });
        var activeIndicator = this._footer.getElementsByClassName(SLIDE_INDICATOR_INACTIVE)[index];
        if (activeIndicator) {
            activeIndicator.classList.remove(SLIDE_INDICATOR_INACTIVE);
            activeIndicator.classList.add(SLIDE_INDICATOR_ACTIVE);
        }
    };
    SlideContainer.prototype.iosProperty = function (theClass, theProperty) {
        if (typeof theProperty === 'function') {
            // xCode 7 and below
            return theProperty.call(theClass);
        }
        else {
            // xCode 8+
            return theProperty;
        }
    };
    SlideContainer.startEvent = 'start';
    SlideContainer.changedEvent = 'changed';
    SlideContainer.cancelledEvent = 'cancelled';
    SlideContainer.finishedEvent = 'finished';
    return SlideContainer;
}(absolute_layout_1.AbsoluteLayout));
exports.SlideContainer = SlideContainer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0aXZlc2NyaXB0LXNsaWRlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5hdGl2ZXNjcmlwdC1zbGlkZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUM1QixrREFBb0Q7QUFDcEQsb0RBQXNEO0FBRXRELCtFQUE2RTtBQUM3RSx5RUFBdUU7QUFFdkUscURBQW9EO0FBQ3BELG1EQUFrRDtBQUNsRCwrREFBaUU7QUFDakUsdURBQXlEO0FBQ3pELG1EQUF3RTtBQU94RSxJQUFNLHdCQUF3QixHQUFHLDBCQUEwQixDQUFDO0FBQzVELElBQU0sc0JBQXNCLEdBQUcsd0JBQXdCLENBQUM7QUFDeEQsSUFBTSxvQkFBb0IsR0FBRyxzQkFBc0IsQ0FBQztBQUNwRCxJQUFJLFlBQWlCLENBQUM7QUFDdEIsSUFBSSxHQUFHLENBQUMsT0FBTyxFQUFFO0lBQ2IsWUFBWSxHQUFRLE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksQ0FBQztDQUMvRDtLQUFNO0lBQ0gsWUFBWSxHQUFHLEVBQUUsQ0FBQztDQUNyQjtBQUVEO0lBQTJCLHlCQUFXO0lBQXRDOztJQUF3QyxDQUFDO0lBQUQsWUFBQztBQUFELENBQUMsQUFBekMsQ0FBMkIsMEJBQVcsR0FBRztBQUE1QixzQkFBSztBQUVsQixJQUFLLFNBSUo7QUFKRCxXQUFLLFNBQVM7SUFDVix5Q0FBSSxDQUFBO0lBQ0oseUNBQUksQ0FBQTtJQUNKLDJDQUFLLENBQUE7QUFDVCxDQUFDLEVBSkksU0FBUyxLQUFULFNBQVMsUUFJYjtBQUVELElBQUssa0JBSUo7QUFKRCxXQUFLLGtCQUFrQjtJQUNuQiwyREFBSSxDQUFBO0lBQ0osMkVBQVksQ0FBQTtJQUNaLDJFQUFZLENBQUE7QUFDaEIsQ0FBQyxFQUpJLGtCQUFrQixLQUFsQixrQkFBa0IsUUFJdEI7QUFTRDtJQUFvQyxrQ0FBYztJQWtHOUM7UUFBQSxZQUNJLGlCQUFPLFNBTVY7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dGVudCI6WyJyZXF1aXJlKCduYXRpdmVzY3JpcHQtZG9tJyk7XG5pbXBvcnQgKiBhcyBhcHAgZnJvbSAndG5zLWNvcmUtbW9kdWxlcy9hcHBsaWNhdGlvbic7XG5pbXBvcnQgKiBhcyBQbGF0Zm9ybSBmcm9tICd0bnMtY29yZS1tb2R1bGVzL3BsYXRmb3JtJztcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJ3Rucy1jb3JlLW1vZHVsZXMvdXRpbHMvdXRpbHMnO1xuaW1wb3J0IHsgQWJzb2x1dGVMYXlvdXQgfSBmcm9tICd0bnMtY29yZS1tb2R1bGVzL3VpL2xheW91dHMvYWJzb2x1dGUtbGF5b3V0JztcbmltcG9ydCB7IFN0YWNrTGF5b3V0IH0gZnJvbSAndG5zLWNvcmUtbW9kdWxlcy91aS9sYXlvdXRzL3N0YWNrLWxheW91dCc7XG5pbXBvcnQgeyBWaWV3IH0gZnJvbSAndG5zLWNvcmUtbW9kdWxlcy91aS9jb3JlL3ZpZXcnO1xuaW1wb3J0IHsgQnV0dG9uIH0gZnJvbSAndG5zLWNvcmUtbW9kdWxlcy91aS9idXR0b24nO1xuaW1wb3J0IHsgTGFiZWwgfSBmcm9tICd0bnMtY29yZS1tb2R1bGVzL3VpL2xhYmVsJztcbmltcG9ydCAqIGFzIEFuaW1hdGlvbk1vZHVsZSBmcm9tICd0bnMtY29yZS1tb2R1bGVzL3VpL2FuaW1hdGlvbic7XG5pbXBvcnQgKiBhcyBnZXN0dXJlcyBmcm9tICd0bnMtY29yZS1tb2R1bGVzL3VpL2dlc3R1cmVzJztcbmltcG9ydCB7IEFuaW1hdGlvbkN1cnZlLCBPcmllbnRhdGlvbiB9IGZyb20gJ3Rucy1jb3JlLW1vZHVsZXMvdWkvZW51bXMnO1xuaW1wb3J0IHsgQ29sb3IgfSBmcm9tICd0bnMtY29yZS1tb2R1bGVzL2NvbG9yJztcbmltcG9ydCB7IEltYWdlIH0gZnJvbSAndG5zLWNvcmUtbW9kdWxlcy91aS9pbWFnZSc7XG5cbmRlY2xhcmUgY29uc3QgYW5kcm9pZDogYW55O1xuZGVjbGFyZSBjb25zdCBjb206IGFueTtcbmRlY2xhcmUgY29uc3QgamF2YTogYW55O1xuY29uc3QgU0xJREVfSU5ESUNBVE9SX0lOQUNUSVZFID0gJ3NsaWRlLWluZGljYXRvci1pbmFjdGl2ZSc7XG5jb25zdCBTTElERV9JTkRJQ0FUT1JfQUNUSVZFID0gJ3NsaWRlLWluZGljYXRvci1hY3RpdmUnO1xuY29uc3QgU0xJREVfSU5ESUNBVE9SX1dSQVAgPSAnc2xpZGUtaW5kaWNhdG9yLXdyYXAnO1xubGV0IExheW91dFBhcmFtczogYW55O1xuaWYgKGFwcC5hbmRyb2lkKSB7XG4gICAgTGF5b3V0UGFyYW1zID0gPGFueT5hbmRyb2lkLnZpZXcuV2luZG93TWFuYWdlci5MYXlvdXRQYXJhbXM7XG59IGVsc2Uge1xuICAgIExheW91dFBhcmFtcyA9IHt9O1xufVxuXG5leHBvcnQgY2xhc3MgU2xpZGUgZXh0ZW5kcyBTdGFja0xheW91dCB7fVxuXG5lbnVtIGRpcmVjdGlvbiB7XG4gICAgbm9uZSxcbiAgICBsZWZ0LFxuICAgIHJpZ2h0XG59XG5cbmVudW0gY2FuY2VsbGF0aW9uUmVhc29uIHtcbiAgICB1c2VyLFxuICAgIG5vUHJldlNsaWRlcyxcbiAgICBub01vcmVTbGlkZXNcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJU2xpZGVNYXAge1xuICAgIHBhbmVsOiBTdGFja0xheW91dDtcbiAgICBpbmRleDogbnVtYmVyO1xuICAgIGxlZnQ/OiBJU2xpZGVNYXA7XG4gICAgcmlnaHQ/OiBJU2xpZGVNYXA7XG59XG5cbmV4cG9ydCBjbGFzcyBTbGlkZUNvbnRhaW5lciBleHRlbmRzIEFic29sdXRlTGF5b3V0IHtcbiAgICBwcml2YXRlIGN1cnJlbnRQYW5lbDogSVNsaWRlTWFwO1xuICAgIHByaXZhdGUgdHJhbnNpdGlvbmluZzogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHByaXZhdGUgZGlyZWN0aW9uOiBkaXJlY3Rpb24gPSBkaXJlY3Rpb24ubm9uZTtcbiAgICBwcml2YXRlIF9sb2FkZWQ6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSBfcGFnZVdpZHRoOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBfbG9vcDogYm9vbGVhbjtcbiAgICBwcml2YXRlIF9wYWdlck9mZnNldDogc3RyaW5nO1xuICAgIHByaXZhdGUgX2FuZ3VsYXI6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSBfZGlzYWJsZVBhbjogYm9vbGVhbjtcbiAgICBwcml2YXRlIF9mb290ZXI6IFN0YWNrTGF5b3V0O1xuICAgIHByaXZhdGUgX3BhZ2VJbmRpY2F0b3JzOiBib29sZWFuO1xuICAgIHByaXZhdGUgX3NsaWRlTWFwOiBJU2xpZGVNYXBbXTtcbiAgICBwcml2YXRlIF9zbGlkZVdpZHRoOiBzdHJpbmc7XG5cbiAgICBwdWJsaWMgc3RhdGljIHN0YXJ0RXZlbnQgPSAnc3RhcnQnO1xuICAgIHB1YmxpYyBzdGF0aWMgY2hhbmdlZEV2ZW50ID0gJ2NoYW5nZWQnO1xuICAgIHB1YmxpYyBzdGF0aWMgY2FuY2VsbGVkRXZlbnQgPSAnY2FuY2VsbGVkJztcbiAgICBwdWJsaWMgc3RhdGljIGZpbmlzaGVkRXZlbnQgPSAnZmluaXNoZWQnO1xuXG4gICAgLyogcGFnZSBpbmRpY2F0b3Igc3R1ZmYqL1xuICAgIGdldCBwYWdlSW5kaWNhdG9ycygpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhZ2VJbmRpY2F0b3JzO1xuICAgIH1cbiAgICBzZXQgcGFnZUluZGljYXRvcnModmFsdWU6IGJvb2xlYW4pIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHZhbHVlID0gPGFueT52YWx1ZSA9PSAndHJ1ZSc7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcGFnZUluZGljYXRvcnMgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgcGFnZXJPZmZzZXQoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3BhZ2VyT2Zmc2V0O1xuICAgIH1cbiAgICBzZXQgcGFnZXJPZmZzZXQodmFsdWU6IHN0cmluZykge1xuICAgICAgICB0aGlzLl9wYWdlck9mZnNldCA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBoYXNOZXh0KCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gISF0aGlzLmN1cnJlbnRQYW5lbCAmJiAhIXRoaXMuY3VycmVudFBhbmVsLnJpZ2h0O1xuICAgIH1cbiAgICBnZXQgaGFzUHJldmlvdXMoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiAhIXRoaXMuY3VycmVudFBhbmVsICYmICEhdGhpcy5jdXJyZW50UGFuZWwubGVmdDtcbiAgICB9XG5cbiAgICBnZXQgbG9vcCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2xvb3A7XG4gICAgfVxuXG4gICAgc2V0IGxvb3AodmFsdWU6IGJvb2xlYW4pIHtcbiAgICAgICAgdGhpcy5fbG9vcCA9IHZhbHVlO1xuICAgIH1cblxuICAgIGdldCBkaXNhYmxlUGFuKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGlzYWJsZVBhbjtcbiAgICB9XG5cbiAgICBzZXQgZGlzYWJsZVBhbih2YWx1ZTogYm9vbGVhbikge1xuICAgICAgICBpZiAodGhpcy5fZGlzYWJsZVBhbiA9PT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSAvLyBWYWx1ZSBkaWQgbm90IGNoYW5nZVxuXG4gICAgICAgIHRoaXMuX2Rpc2FibGVQYW4gPSB2YWx1ZTtcbiAgICAgICAgaWYgKHRoaXMuX2xvYWRlZCAmJiB0aGlzLmN1cnJlbnRQYW5lbC5wYW5lbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQYW5lbC5wYW5lbC5vZmYoJ3BhbicpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFwcGx5U3dpcGUodGhpcy5wYWdlV2lkdGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0IHBhZ2VXaWR0aCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLnNsaWRlV2lkdGgpIHtcbiAgICAgICAgICAgIHJldHVybiBQbGF0Zm9ybS5zY3JlZW4ubWFpblNjcmVlbi53aWR0aERJUHM7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICt0aGlzLnNsaWRlV2lkdGg7XG4gICAgfVxuXG4gICAgZ2V0IGFuZ3VsYXIoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hbmd1bGFyO1xuICAgIH1cblxuICAgIHNldCBhbmd1bGFyKHZhbHVlOiBib29sZWFuKSB7XG4gICAgICAgIHRoaXMuX2FuZ3VsYXIgPSB2YWx1ZTtcbiAgICB9XG5cbiAgICBnZXQgY3VycmVudEluZGV4KCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRQYW5lbC5pbmRleDtcbiAgICB9XG5cbiAgICBnZXQgc2xpZGVXaWR0aCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2xpZGVXaWR0aDtcbiAgICB9XG4gICAgc2V0IHNsaWRlV2lkdGgod2lkdGg6IHN0cmluZykge1xuICAgICAgICB0aGlzLl9zbGlkZVdpZHRoID0gd2lkdGg7XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuc2V0dXBEZWZhdWx0VmFsdWVzKCk7XG4gICAgICAgIC8vIGlmIGJlaW5nIHVzZWQgaW4gYW4gbmcyIGFwcCB3ZSB3YW50IHRvIHByZXZlbnQgaXQgZnJvbSBleGN1dGluZyB0aGUgY29uc3RydWN0Vmlld1xuICAgICAgICAvLyB1bnRpbCBpdCBpcyBjYWxsZWQgbWFudWFsbHkgaW4gbmdBZnRlclZpZXdJbml0LlxuXG4gICAgICAgIHRoaXMuY29uc3RydWN0Vmlldyh0cnVlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldHVwRGVmYXVsdFZhbHVlcygpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jbGlwVG9Cb3VuZHMgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuX2xvYWRlZCA9IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5fbG9vcCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmxvb3AgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlO1xuXG4gICAgICAgIGlmICh0aGlzLl9kaXNhYmxlUGFuID09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuZGlzYWJsZVBhbiA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2FuZ3VsYXIgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5hbmd1bGFyID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fcGFnZUluZGljYXRvcnMgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5fcGFnZUluZGljYXRvcnMgPSBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9wYWdlck9mZnNldCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLl9wYWdlck9mZnNldCA9ICc4OCUnOyAvL2RlZmF1bHRzIHRvIHdoaXRlLlxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGNvbnN0cnVjdFZpZXcoY29uc3RydWN0b3I6IGJvb2xlYW4gPSBmYWxzZSk6IHZvaWQge1xuICAgICAgICB0aGlzLm9uKEFic29sdXRlTGF5b3V0LmxvYWRlZEV2ZW50LCAoZGF0YTogYW55KSA9PiB7XG4gICAgICAgICAgICAvLy8vIGNvbnNvbGUubG9nKCdMT0FEREVEIEVWRU5UJyk7XG4gICAgICAgICAgICBpZiAoIXRoaXMuX2xvYWRlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2xvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYW5ndWxhciA9PT0gdHJ1ZSAmJiBjb25zdHJ1Y3RvciA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbGV0IHNsaWRlczogU3RhY2tMYXlvdXRbXSA9IFtdO1xuXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLnNsaWRlV2lkdGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zbGlkZVdpZHRoID0gPGFueT50aGlzLnBhZ2VXaWR0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9ICt0aGlzLnNsaWRlV2lkdGg7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmVhY2hMYXlvdXRDaGlsZCgodmlldzogVmlldykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodmlldyBpbnN0YW5jZW9mIFN0YWNrTGF5b3V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBBYnNvbHV0ZUxheW91dC5zZXRMZWZ0KHZpZXcsIHRoaXMucGFnZVdpZHRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcud2lkdGggPSB0aGlzLnBhZ2VXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PnZpZXcpLmhlaWdodCA9ICcxMDAlJzsgLy9nZXQgYXJvdW5kIGNvbXBpbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICBzbGlkZXMucHVzaCh2aWV3KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucGFnZUluZGljYXRvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZm9vdGVyID0gdGhpcy5idWlsZEZvb3RlcihzbGlkZXMubGVuZ3RoLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRBY3RpdmVQYWdlSW5kaWNhdG9yKDApO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluc2VydENoaWxkKHRoaXMuX2Zvb3RlciwgdGhpcy5nZXRDaGlsZHJlbkNvdW50KCkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFBhbmVsID0gdGhpcy5idWlsZFNsaWRlTWFwKHNsaWRlcyk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFBhbmVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9zaXRpb25QYW5lbHModGhpcy5jdXJyZW50UGFuZWwpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmRpc2FibGVQYW4gPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFwcGx5U3dpcGUodGhpcy5wYWdlV2lkdGgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChhcHAuaW9zKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlvcy5jbGlwc1RvQm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vaGFuZGxlcyBhcHBsaWNhdGlvbiBvcmllbnRhdGlvbiBjaGFuZ2VcbiAgICAgICAgICAgICAgICAgICAgYXBwLm9uKFxuICAgICAgICAgICAgICAgICAgICAgICAgYXBwLm9yaWVudGF0aW9uQ2hhbmdlZEV2ZW50LFxuICAgICAgICAgICAgICAgICAgICAgICAgKGFyZ3M6IGFwcC5PcmllbnRhdGlvbkNoYW5nZWRFdmVudERhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2V2ZW50IGFuZCBwYWdlIG9yaWVudGF0aW9uIGRpZG4ndCBzZWVtIHRvIGFsd2FzeSBiZSBvbiB0aGUgc2FtZSBwYWdlIHNvIHNldHRpbmcgaXQgaW4gdGhlIHRpbWUgb3V0IGFkZHJlc3NlcyB0aGlzLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZygnb3JpZW50YXRpb25DaGFuZ2VkRXZlbnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53aWR0aCA9IHBhcnNlSW50KHRoaXMuc2xpZGVXaWR0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZWFjaExheW91dENoaWxkKCh2aWV3OiBWaWV3KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmlldyBpbnN0YW5jZW9mIFN0YWNrTGF5b3V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQWJzb2x1dGVMYXlvdXQuc2V0TGVmdCh2aWV3LCB0aGlzLnBhZ2VXaWR0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlldy53aWR0aCA9IHRoaXMucGFnZVdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5kaXNhYmxlUGFuID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hcHBseVN3aXBlKHRoaXMucGFnZVdpZHRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnBhZ2VJbmRpY2F0b3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBYnNvbHV0ZUxheW91dC5zZXRUb3AodGhpcy5fZm9vdGVyLCAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwYWdlSW5kaWNhdG9yc0xlZnRPZmZzZXQgPSB0aGlzLnBhZ2VXaWR0aCAvIDQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBBYnNvbHV0ZUxheW91dC5zZXRMZWZ0KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2Zvb3RlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWdlSW5kaWNhdG9yc0xlZnRPZmZzZXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9mb290ZXIud2lkdGggPSB0aGlzLnBhZ2VXaWR0aCAvIDI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9mb290ZXIubWFyZ2luVG9wID0gPGFueT50aGlzLl9wYWdlck9mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucG9zaXRpb25QYW5lbHModGhpcy5jdXJyZW50UGFuZWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIG5leHRTbGlkZSgpOiB2b2lkIHtcbiAgICAgICAgaWYgKCF0aGlzLmhhc05leHQpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlckNhbmNlbEV2ZW50KGNhbmNlbGxhdGlvblJlYXNvbi5ub01vcmVTbGlkZXMpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5kaXJlY3Rpb24gPSBkaXJlY3Rpb24ubGVmdDtcbiAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZTtcbiAgICAgICAgdGhpcy50cmlnZ2VyU3RhcnRFdmVudCgpO1xuICAgICAgICB0aGlzLnNob3dSaWdodFNsaWRlKHRoaXMuY3VycmVudFBhbmVsKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuc2V0dXBQYW5lbCh0aGlzLmN1cnJlbnRQYW5lbC5yaWdodCk7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJDaGFuZ2VFdmVudFJpZ2h0VG9MZWZ0KCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBwdWJsaWMgcHJldmlvdXNTbGlkZSgpOiB2b2lkIHtcbiAgICAgICAgaWYgKCF0aGlzLmhhc1ByZXZpb3VzKSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJDYW5jZWxFdmVudChjYW5jZWxsYXRpb25SZWFzb24ubm9QcmV2U2xpZGVzKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZGlyZWN0aW9uID0gZGlyZWN0aW9uLnJpZ2h0O1xuICAgICAgICB0aGlzLnRyYW5zaXRpb25pbmcgPSB0cnVlO1xuICAgICAgICB0aGlzLnRyaWdnZXJTdGFydEV2ZW50KCk7XG4gICAgICAgIHRoaXMuc2hvd0xlZnRTbGlkZSh0aGlzLmN1cnJlbnRQYW5lbCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNldHVwUGFuZWwodGhpcy5jdXJyZW50UGFuZWwubGVmdCk7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXJDaGFuZ2VFdmVudExlZnRUb1JpZ2h0KCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0dXBQYW5lbChwYW5lbDogSVNsaWRlTWFwKSB7XG4gICAgICAgIHRoaXMuZGlyZWN0aW9uID0gZGlyZWN0aW9uLm5vbmU7XG4gICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmN1cnJlbnRQYW5lbC5wYW5lbC5vZmYoJ3BhbicpO1xuICAgICAgICB0aGlzLmN1cnJlbnRQYW5lbCA9IHBhbmVsO1xuXG4gICAgICAgIC8vIHNldHMgdXAgZWFjaCBwYW5lbCBzbyB0aGF0IHRoZXkgYXJlIHBvc2l0aW9uZWQgdG8gdHJhbnNpdGlvbiBlaXRoZXIgd2F5LlxuICAgICAgICB0aGlzLnBvc2l0aW9uUGFuZWxzKHRoaXMuY3VycmVudFBhbmVsKTtcblxuICAgICAgICBpZiAodGhpcy5kaXNhYmxlUGFuID09PSBmYWxzZSkge1xuICAgICAgICAgICAgdGhpcy5hcHBseVN3aXBlKHRoaXMucGFnZVdpZHRoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnBhZ2VJbmRpY2F0b3JzKSB7XG4gICAgICAgICAgICB0aGlzLnNldEFjdGl2ZVBhZ2VJbmRpY2F0b3IodGhpcy5jdXJyZW50UGFuZWwuaW5kZXgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBwb3NpdGlvblBhbmVscyhwYW5lbDogSVNsaWRlTWFwKSB7XG4gICAgICAgIC8vIHNldHMgdXAgZWFjaCBwYW5lbCBzbyB0aGF0IHRoZXkgYXJlIHBvc2l0aW9uZWQgdG8gdHJhbnNpdGlvbiBlaXRoZXIgd2F5LlxuICAgICAgICBpZiAocGFuZWwubGVmdCAhPSBudWxsKSB7XG4gICAgICAgICAgICBwYW5lbC5sZWZ0LnBhbmVsLnRyYW5zbGF0ZVggPSAtdGhpcy5wYWdlV2lkdGggKiAyO1xuICAgICAgICB9XG4gICAgICAgIHBhbmVsLnBhbmVsLnRyYW5zbGF0ZVggPSAtdGhpcy5wYWdlV2lkdGg7XG4gICAgICAgIGlmIChwYW5lbC5yaWdodCAhPSBudWxsKSB7XG4gICAgICAgICAgICBwYW5lbC5yaWdodC5wYW5lbC50cmFuc2xhdGVYID0gMDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBnb1RvU2xpZGUoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLl9zbGlkZU1hcCAmJlxuICAgICAgICAgICAgdGhpcy5fc2xpZGVNYXAubGVuZ3RoID4gMCAmJlxuICAgICAgICAgICAgaW5kZXggPCB0aGlzLl9zbGlkZU1hcC5sZW5ndGhcbiAgICAgICAgKSB7XG4gICAgICAgICAgICBsZXQgcHJldmlvdXNTbGlkZSA9IHRoaXMuY3VycmVudFBhbmVsO1xuXG4gICAgICAgICAgICB0aGlzLnNldHVwUGFuZWwodGhpcy5fc2xpZGVNYXBbaW5kZXhdKTtcblxuICAgICAgICAgICAgdGhpcy5ub3RpZnkoe1xuICAgICAgICAgICAgICAgIGV2ZW50TmFtZTogU2xpZGVDb250YWluZXIuY2hhbmdlZEV2ZW50LFxuICAgICAgICAgICAgICAgIG9iamVjdDogdGhpcyxcbiAgICAgICAgICAgICAgICBldmVudERhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24ubm9uZSxcbiAgICAgICAgICAgICAgICAgICAgbmV3SW5kZXg6IHRoaXMuY3VycmVudFBhbmVsLmluZGV4LFxuICAgICAgICAgICAgICAgICAgICBvbGRJbmRleDogcHJldmlvdXNTbGlkZS5pbmRleFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2ludmFsaWQgaW5kZXgnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhcHBseVN3aXBlKHBhZ2VXaWR0aDogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGxldCBwcmV2aW91c0RlbHRhID0gLTE7IC8vaGFjayB0byBnZXQgYXJvdW5kIGlvcyBmaXJpbmcgcGFuIGV2ZW50IGFmdGVyIHJlbGVhc2VcbiAgICAgICAgbGV0IGVuZGluZ1ZlbG9jaXR5ID0gMDtcbiAgICAgICAgbGV0IHN0YXJ0VGltZSwgZGVsdGFUaW1lO1xuXG4gICAgICAgIHRoaXMuY3VycmVudFBhbmVsLnBhbmVsLm9uKFxuICAgICAgICAgICAgJ3BhbicsXG4gICAgICAgICAgICAoYXJnczogZ2VzdHVyZXMuUGFuR2VzdHVyZUV2ZW50RGF0YSk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhcmdzLnN0YXRlID09PSBnZXN0dXJlcy5HZXN0dXJlU3RhdGVUeXBlcy5iZWdhbikge1xuICAgICAgICAgICAgICAgICAgICBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgICAgICBwcmV2aW91c0RlbHRhID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZW5kaW5nVmVsb2NpdHkgPSAyNTA7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyU3RhcnRFdmVudCgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXJncy5zdGF0ZSA9PT0gZ2VzdHVyZXMuR2VzdHVyZVN0YXRlVHlwZXMuZW5kZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsdGFUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgdmVsb2NpdHlTY3JvbGxpbmcgaXMgZW5hYmxlZCB0aGVuIGNhbGN1bGF0ZSB0aGUgdmVsb2NpdHR5XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gc3dpcGluZyBsZWZ0IHRvIHJpZ2h0LlxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJncy5kZWx0YVggPiBwYWdlV2lkdGggLyAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5oYXNQcmV2aW91cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zaG93TGVmdFNsaWRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQYW5lbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncy5kZWx0YVgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZGluZ1ZlbG9jaXR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXR1cFBhbmVsKHRoaXMuY3VycmVudFBhbmVsLmxlZnQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlckNoYW5nZUV2ZW50TGVmdFRvUmlnaHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9XZSdyZSBhdCB0aGUgc3RhcnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL05vdGlmeSBubyBtb3JlIHNsaWRlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlckNhbmNlbEV2ZW50KGNhbmNlbGxhdGlvblJlYXNvbi5ub1ByZXZTbGlkZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIHN3aXBpbmcgcmlnaHQgdG8gbGVmdFxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmIChhcmdzLmRlbHRhWCA8IC1wYWdlV2lkdGggLyAzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5oYXNOZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmFuc2l0aW9uaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dSaWdodFNsaWRlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQYW5lbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJncy5kZWx0YVgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZGluZ1ZlbG9jaXR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXR1cFBhbmVsKHRoaXMuY3VycmVudFBhbmVsLnJpZ2h0KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOb3RpZnkgY2hhbmdlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJDaGFuZ2VFdmVudFJpZ2h0VG9MZWZ0KCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF0aGlzLmhhc05leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5vdGlmeSBmaW5zaWhlZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ub3RpZnkoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50TmFtZTogU2xpZGVDb250YWluZXIuZmluaXNoZWRFdmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3Q6IHRoaXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdlJ3JlIGF0IHRoZSBlbmRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOb3RpZnkgbm8gbW9yZSBzbGlkZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXJDYW5jZWxFdmVudChjYW5jZWxsYXRpb25SZWFzb24ubm9Nb3JlU2xpZGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnRyYW5zaXRpb25pbmcgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL05vdGlmeSBjYW5jZWxsZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlckNhbmNlbEV2ZW50KGNhbmNlbGxhdGlvblJlYXNvbi51c2VyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQYW5lbC5wYW5lbC5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2xhdGU6IHsgeDogLXRoaXMucGFnZVdpZHRoLCB5OiAwIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IDIwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJ2ZTogQW5pbWF0aW9uQ3VydmUuZWFzZU91dFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5oYXNOZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFuZWwucmlnaHQucGFuZWwuYW5pbWF0ZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zbGF0ZTogeyB4OiAwLCB5OiAwIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAyMDAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnZlOiBBbmltYXRpb25DdXJ2ZS5lYXNlT3V0XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFwcC5pb3MpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9mb3Igc29tZSByZWFzb24gaSBoYXZlIHRvIHNldCB0aGVzZSBpbiBpb3Mgb3IgdGhlcmUgaXMgc29tZSBzb3J0IG9mIGJvdW5jZSBiYWNrLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQYW5lbC5yaWdodC5wYW5lbC50cmFuc2xhdGVYID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc1ByZXZpb3VzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFuZWwubGVmdC5wYW5lbC5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNsYXRlOiB7IHg6IC10aGlzLnBhZ2VXaWR0aCAqIDIsIHk6IDAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IDIwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VydmU6IEFuaW1hdGlvbkN1cnZlLmVhc2VPdXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXBwLmlvcylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFuZWwubGVmdC5wYW5lbC50cmFuc2xhdGVYID0gLXRoaXMucGFnZVdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFwcC5pb3MpIHRoaXMuY3VycmVudFBhbmVsLnBhbmVsLnRyYW5zbGF0ZVggPSAtdGhpcy5wYWdlV2lkdGg7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNpdGlvbmluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICAgICAgICAgICAgIXRoaXMudHJhbnNpdGlvbmluZyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNEZWx0YSAhPT0gYXJncy5kZWx0YVggJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MuZGVsdGFYICE9IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MuZGVsdGFYIDwgMFxuICAgICAgICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc05leHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpcmVjdGlvbiA9IGRpcmVjdGlvbi5sZWZ0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFBhbmVsLnBhbmVsLnRyYW5zbGF0ZVggPSBhcmdzLmRlbHRhWCAtIHRoaXMucGFnZVdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFBhbmVsLnJpZ2h0LnBhbmVsLnRyYW5zbGF0ZVggPSBhcmdzLmRlbHRhWDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgICAgICAgICAgICF0aGlzLnRyYW5zaXRpb25pbmcgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzRGVsdGEgIT09IGFyZ3MuZGVsdGFYICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzLmRlbHRhWCAhPSBudWxsICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzLmRlbHRhWCA+IDBcbiAgICAgICAgICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5oYXNQcmV2aW91cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZGlyZWN0aW9uID0gZGlyZWN0aW9uLnJpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFBhbmVsLnBhbmVsLnRyYW5zbGF0ZVggPSBhcmdzLmRlbHRhWCAtIHRoaXMucGFnZVdpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFBhbmVsLmxlZnQucGFuZWwudHJhbnNsYXRlWCA9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0odGhpcy5wYWdlV2lkdGggKiAyKSArIGFyZ3MuZGVsdGFYO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZ3MuZGVsdGFYICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91c0RlbHRhID0gYXJncy5kZWx0YVg7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzaG93UmlnaHRTbGlkZShcbiAgICAgICAgcGFuZWxNYXA6IElTbGlkZU1hcCxcbiAgICAgICAgb2Zmc2V0OiBudW1iZXIgPSB0aGlzLnBhZ2VXaWR0aCxcbiAgICAgICAgZW5kaW5nVmVsb2NpdHk6IG51bWJlciA9IDMyXG4gICAgKTogQW5pbWF0aW9uTW9kdWxlLkFuaW1hdGlvblByb21pc2Uge1xuICAgICAgICBsZXQgYW5pbWF0aW9uRHVyYXRpb246IG51bWJlcjtcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb24gPSAzMDA7IC8vIGRlZmF1bHQgdmFsdWVcblxuICAgICAgICBsZXQgdHJhbnNpdGlvbiA9IG5ldyBBcnJheSgpO1xuXG4gICAgICAgIHRyYW5zaXRpb24ucHVzaCh7XG4gICAgICAgICAgICB0YXJnZXQ6IHBhbmVsTWFwLnJpZ2h0LnBhbmVsLFxuICAgICAgICAgICAgdHJhbnNsYXRlOiB7IHg6IC10aGlzLnBhZ2VXaWR0aCwgeTogMCB9LFxuICAgICAgICAgICAgZHVyYXRpb246IGFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgICAgY3VydmU6IEFuaW1hdGlvbkN1cnZlLmVhc2VPdXRcbiAgICAgICAgfSk7XG4gICAgICAgIHRyYW5zaXRpb24ucHVzaCh7XG4gICAgICAgICAgICB0YXJnZXQ6IHBhbmVsTWFwLnBhbmVsLFxuICAgICAgICAgICAgdHJhbnNsYXRlOiB7IHg6IC10aGlzLnBhZ2VXaWR0aCAqIDIsIHk6IDAgfSxcbiAgICAgICAgICAgIGR1cmF0aW9uOiBhbmltYXRpb25EdXJhdGlvbixcbiAgICAgICAgICAgIGN1cnZlOiBBbmltYXRpb25DdXJ2ZS5lYXNlT3V0XG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgYW5pbWF0aW9uU2V0ID0gbmV3IEFuaW1hdGlvbk1vZHVsZS5BbmltYXRpb24odHJhbnNpdGlvbiwgZmFsc2UpO1xuXG4gICAgICAgIHJldHVybiBhbmltYXRpb25TZXQucGxheSgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2hvd0xlZnRTbGlkZShcbiAgICAgICAgcGFuZWxNYXA6IElTbGlkZU1hcCxcbiAgICAgICAgb2Zmc2V0OiBudW1iZXIgPSB0aGlzLnBhZ2VXaWR0aCxcbiAgICAgICAgZW5kaW5nVmVsb2NpdHk6IG51bWJlciA9IDMyXG4gICAgKTogQW5pbWF0aW9uTW9kdWxlLkFuaW1hdGlvblByb21pc2Uge1xuICAgICAgICBsZXQgYW5pbWF0aW9uRHVyYXRpb246IG51bWJlcjtcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb24gPSAzMDA7IC8vIGRlZmF1bHQgdmFsdWVcbiAgICAgICAgbGV0IHRyYW5zaXRpb24gPSBuZXcgQXJyYXkoKTtcblxuICAgICAgICB0cmFuc2l0aW9uLnB1c2goe1xuICAgICAgICAgICAgdGFyZ2V0OiBwYW5lbE1hcC5sZWZ0LnBhbmVsLFxuICAgICAgICAgICAgdHJhbnNsYXRlOiB7IHg6IC10aGlzLnBhZ2VXaWR0aCwgeTogMCB9LFxuICAgICAgICAgICAgZHVyYXRpb246IGFuaW1hdGlvbkR1cmF0aW9uLFxuICAgICAgICAgICAgY3VydmU6IEFuaW1hdGlvbkN1cnZlLmVhc2VPdXRcbiAgICAgICAgfSk7XG4gICAgICAgIHRyYW5zaXRpb24ucHVzaCh7XG4gICAgICAgICAgICB0YXJnZXQ6IHBhbmVsTWFwLnBhbmVsLFxuICAgICAgICAgICAgdHJhbnNsYXRlOiB7IHg6IDAsIHk6IDAgfSxcbiAgICAgICAgICAgIGR1cmF0aW9uOiBhbmltYXRpb25EdXJhdGlvbixcbiAgICAgICAgICAgIGN1cnZlOiBBbmltYXRpb25DdXJ2ZS5lYXNlT3V0XG4gICAgICAgIH0pO1xuICAgICAgICBsZXQgYW5pbWF0aW9uU2V0ID0gbmV3IEFuaW1hdGlvbk1vZHVsZS5BbmltYXRpb24odHJhbnNpdGlvbiwgZmFsc2UpO1xuXG4gICAgICAgIHJldHVybiBhbmltYXRpb25TZXQucGxheSgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYnVpbGRGb290ZXIoXG4gICAgICAgIHBhZ2VDb3VudDogbnVtYmVyID0gNSxcbiAgICAgICAgYWN0aXZlSW5kZXg6IG51bWJlciA9IDBcbiAgICApOiBTdGFja0xheW91dCB7XG4gICAgICAgIGxldCBmb290ZXJJbm5lcldyYXAgPSBuZXcgU3RhY2tMYXlvdXQoKTtcblxuICAgICAgICAvL2Zvb3RlcklubmVyV3JhcC5oZWlnaHQgPSA1MDtcbiAgICAgICAgaWYgKGFwcC5pb3MpIHtcbiAgICAgICAgICAgIGZvb3RlcklubmVyV3JhcC5jbGlwVG9Cb3VuZHMgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBmb290ZXJJbm5lcldyYXAuY2xhc3NOYW1lID0gU0xJREVfSU5ESUNBVE9SX1dSQVA7XG5cbiAgICAgICAgQWJzb2x1dGVMYXlvdXQuc2V0VG9wKGZvb3RlcklubmVyV3JhcCwgMCk7XG5cbiAgICAgICAgZm9vdGVySW5uZXJXcmFwLm9yaWVudGF0aW9uID0gJ2hvcml6b250YWwnO1xuICAgICAgICBmb290ZXJJbm5lcldyYXAuaG9yaXpvbnRhbEFsaWdubWVudCA9ICdjZW50ZXInO1xuICAgICAgICBmb290ZXJJbm5lcldyYXAud2lkdGggPSB0aGlzLnBhZ2VXaWR0aCAvIDI7XG5cbiAgICAgICAgbGV0IGluZGV4ID0gMDtcbiAgICAgICAgd2hpbGUgKGluZGV4IDwgcGFnZUNvdW50KSB7XG4gICAgICAgICAgICBmb290ZXJJbm5lcldyYXAuYWRkQ2hpbGQodGhpcy5jcmVhdGVJbmRpY2F0b3IoaW5kZXgpKTtcbiAgICAgICAgICAgIGluZGV4Kys7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgcGFnZUluZGljYXRvcnNMZWZ0T2Zmc2V0ID0gdGhpcy5wYWdlV2lkdGggLyA0O1xuICAgICAgICBBYnNvbHV0ZUxheW91dC5zZXRMZWZ0KGZvb3RlcklubmVyV3JhcCwgcGFnZUluZGljYXRvcnNMZWZ0T2Zmc2V0KTtcbiAgICAgICAgZm9vdGVySW5uZXJXcmFwLm1hcmdpblRvcCA9IDxhbnk+dGhpcy5fcGFnZXJPZmZzZXQ7XG5cbiAgICAgICAgcmV0dXJuIGZvb3RlcklubmVyV3JhcDtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldHdpZHRoUGVyY2VudCh2aWV3OiBWaWV3LCBwZXJjZW50YWdlOiBudW1iZXIpIHtcbiAgICAgICAgKDxhbnk+dmlldykud2lkdGggPSBwZXJjZW50YWdlICsgJyUnO1xuICAgIH1cblxuICAgIHByaXZhdGUgbmV3Rm9vdGVyQnV0dG9uKG5hbWU6IHN0cmluZyk6IEJ1dHRvbiB7XG4gICAgICAgIGxldCBidXR0b24gPSBuZXcgQnV0dG9uKCk7XG4gICAgICAgIGJ1dHRvbi5pZCA9ICdidG4taW5mby0nICsgbmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBidXR0b24udGV4dCA9IG5hbWU7XG4gICAgICAgIHRoaXMuc2V0d2lkdGhQZXJjZW50KGJ1dHRvbiwgMTAwKTtcbiAgICAgICAgcmV0dXJuIGJ1dHRvbjtcbiAgICB9XG5cbiAgICBwcml2YXRlIGJ1aWxkU2xpZGVNYXAodmlld3M6IFN0YWNrTGF5b3V0W10pIHtcbiAgICAgICAgdGhpcy5fc2xpZGVNYXAgPSBbXTtcbiAgICAgICAgdmlld3MuZm9yRWFjaCgodmlldzogU3RhY2tMYXlvdXQsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX3NsaWRlTWFwLnB1c2goe1xuICAgICAgICAgICAgICAgIHBhbmVsOiB2aWV3LFxuICAgICAgICAgICAgICAgIGluZGV4OiBpbmRleFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl9zbGlkZU1hcC5mb3JFYWNoKChtYXBwaW5nOiBJU2xpZGVNYXAsIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zbGlkZU1hcFtpbmRleCAtIDFdICE9IG51bGwpXG4gICAgICAgICAgICAgICAgbWFwcGluZy5sZWZ0ID0gdGhpcy5fc2xpZGVNYXBbaW5kZXggLSAxXTtcbiAgICAgICAgICAgIGlmICh0aGlzLl9zbGlkZU1hcFtpbmRleCArIDFdICE9IG51bGwpXG4gICAgICAgICAgICAgICAgbWFwcGluZy5yaWdodCA9IHRoaXMuX3NsaWRlTWFwW2luZGV4ICsgMV07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh0aGlzLmxvb3AgPT09IHRydWUpIHtcbiAgICAgICAgICAgIHRoaXMuX3NsaWRlTWFwWzBdLmxlZnQgPSB0aGlzLl9zbGlkZU1hcFt0aGlzLl9zbGlkZU1hcC5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIHRoaXMuX3NsaWRlTWFwW3RoaXMuX3NsaWRlTWFwLmxlbmd0aCAtIDFdLnJpZ2h0ID0gdGhpcy5fc2xpZGVNYXBbMF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX3NsaWRlTWFwWzBdO1xuICAgIH1cblxuICAgIHByaXZhdGUgdHJpZ2dlclN0YXJ0RXZlbnQoKSB7XG4gICAgICAgIHRoaXMubm90aWZ5KHtcbiAgICAgICAgICAgIGV2ZW50TmFtZTogU2xpZGVDb250YWluZXIuc3RhcnRFdmVudCxcbiAgICAgICAgICAgIG9iamVjdDogdGhpcyxcbiAgICAgICAgICAgIGV2ZW50RGF0YToge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJbmRleDogdGhpcy5jdXJyZW50UGFuZWwuaW5kZXhcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB0cmlnZ2VyQ2hhbmdlRXZlbnRMZWZ0VG9SaWdodCgpIHtcbiAgICAgICAgdGhpcy5ub3RpZnkoe1xuICAgICAgICAgICAgZXZlbnROYW1lOiBTbGlkZUNvbnRhaW5lci5jaGFuZ2VkRXZlbnQsXG4gICAgICAgICAgICBvYmplY3Q6IHRoaXMsXG4gICAgICAgICAgICBldmVudERhdGE6IHtcbiAgICAgICAgICAgICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbi5sZWZ0LFxuICAgICAgICAgICAgICAgIG5ld0luZGV4OiB0aGlzLmN1cnJlbnRQYW5lbC5pbmRleCxcbiAgICAgICAgICAgICAgICBvbGRJbmRleDogdGhpcy5jdXJyZW50UGFuZWwuaW5kZXggKyAxXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgdHJpZ2dlckNoYW5nZUV2ZW50UmlnaHRUb0xlZnQoKSB7XG4gICAgICAgIHRoaXMubm90aWZ5KHtcbiAgICAgICAgICAgIGV2ZW50TmFtZTogU2xpZGVDb250YWluZXIuY2hhbmdlZEV2ZW50LFxuICAgICAgICAgICAgb2JqZWN0OiB0aGlzLFxuICAgICAgICAgICAgZXZlbnREYXRhOiB7XG4gICAgICAgICAgICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24ucmlnaHQsXG4gICAgICAgICAgICAgICAgbmV3SW5kZXg6IHRoaXMuY3VycmVudFBhbmVsLmluZGV4LFxuICAgICAgICAgICAgICAgIG9sZEluZGV4OiB0aGlzLmN1cnJlbnRQYW5lbC5pbmRleCAtIDFcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB0cmlnZ2VyQ2FuY2VsRXZlbnQoY2FuY2VsUmVhc29uOiBjYW5jZWxsYXRpb25SZWFzb24pIHtcbiAgICAgICAgdGhpcy5ub3RpZnkoe1xuICAgICAgICAgICAgZXZlbnROYW1lOiBTbGlkZUNvbnRhaW5lci5jYW5jZWxsZWRFdmVudCxcbiAgICAgICAgICAgIG9iamVjdDogdGhpcyxcbiAgICAgICAgICAgIGV2ZW50RGF0YToge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRJbmRleDogdGhpcy5jdXJyZW50UGFuZWwuaW5kZXgsXG4gICAgICAgICAgICAgICAgcmVhc29uOiBjYW5jZWxSZWFzb25cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgY3JlYXRlSW5kaWNhdG9yKGluZGV4OiBudW1iZXIpOiBMYWJlbCB7XG4gICAgICAgIGxldCBpbmRpY2F0b3IgPSBuZXcgTGFiZWwoKTtcblxuICAgICAgICAoPGFueT5pbmRpY2F0b3IpLmNsYXNzTGlzdC5hZGQoU0xJREVfSU5ESUNBVE9SX0lOQUNUSVZFKTtcbiAgICAgICAgcmV0dXJuIGluZGljYXRvcjtcbiAgICB9XG5cbiAgICBzZXRBY3RpdmVQYWdlSW5kaWNhdG9yKGluZGV4OiBudW1iZXIpIHtcbiAgICAgICAgbGV0IGluZGljYXRvcnNUb0RlYWN0aXZhdGUgPSAoPGFueT50aGlzLl9mb290ZXIpLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXG4gICAgICAgICAgICBTTElERV9JTkRJQ0FUT1JfQUNUSVZFXG4gICAgICAgICk7XG5cbiAgICAgICAgaW5kaWNhdG9yc1RvRGVhY3RpdmF0ZS5mb3JFYWNoKGFjdGl2ZUluZGljYXRvciA9PiB7XG4gICAgICAgICAgICBhY3RpdmVJbmRpY2F0b3IuY2xhc3NMaXN0LnJlbW92ZShTTElERV9JTkRJQ0FUT1JfQUNUSVZFKTtcbiAgICAgICAgICAgIGFjdGl2ZUluZGljYXRvci5jbGFzc0xpc3QuYWRkKFNMSURFX0lORElDQVRPUl9JTkFDVElWRSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBhY3RpdmVJbmRpY2F0b3IgPSAoPGFueT50aGlzLl9mb290ZXIpLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoXG4gICAgICAgICAgICBTTElERV9JTkRJQ0FUT1JfSU5BQ1RJVkVcbiAgICAgICAgKVtpbmRleF07XG4gICAgICAgIGlmIChhY3RpdmVJbmRpY2F0b3IpIHtcbiAgICAgICAgICAgIGFjdGl2ZUluZGljYXRvci5jbGFzc0xpc3QucmVtb3ZlKFNMSURFX0lORElDQVRPUl9JTkFDVElWRSk7XG4gICAgICAgICAgICBhY3RpdmVJbmRpY2F0b3IuY2xhc3NMaXN0LmFkZChTTElERV9JTkRJQ0FUT1JfQUNUSVZFKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlvc1Byb3BlcnR5KHRoZUNsYXNzLCB0aGVQcm9wZXJ0eSkge1xuICAgICAgICBpZiAodHlwZW9mIHRoZVByb3BlcnR5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAvLyB4Q29kZSA3IGFuZCBiZWxvd1xuICAgICAgICAgICAgcmV0dXJuIHRoZVByb3BlcnR5LmNhbGwodGhlQ2xhc3MpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8geENvZGUgOCtcbiAgICAgICAgICAgIHJldHVybiB0aGVQcm9wZXJ0eTtcbiAgICAgICAgfVxuICAgIH1cbn0iXX0=