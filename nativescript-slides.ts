require('nativescript-dom-plugin');

import * as app from 'tns-core-modules/application';
import * as Platform from 'tns-core-modules/platform';
import { AbsoluteLayout } from 'tns-core-modules/ui/layouts/absolute-layout';
import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';
import {
    EventData,
    PercentLength,
    View,
} from 'tns-core-modules/ui/core/view';
import { Button } from 'tns-core-modules/ui/button';
import { Label } from 'tns-core-modules/ui/label';
import * as AnimationModule from 'tns-core-modules/ui/animation';
import * as gestures from 'tns-core-modules/ui/gestures';
import { AnimationCurve } from 'tns-core-modules/ui/enums';
import * as TNSDom from 'nativescript-dom-plugin';

const SLIDE_INDICATOR_INACTIVE = 'slide-indicator-inactive';
const SLIDE_INDICATOR_ACTIVE = 'slide-indicator-active';
const SLIDE_INDICATOR_WRAP = 'slide-indicator-wrap';

export class Slide extends StackLayout {}

enum direction {
    none,
    left,
    right,
}

enum cancellationReason {
    user,
    noPrevSlides,
    noMoreSlides,
}

export interface SlideMap {
    panel: StackLayout;
    index: number;
    left?: SlideMap;
    right?: SlideMap;
}

type Footer = StackLayout & {
    getElementsByClassName: typeof TNSDom.getElementsByClassName;
};

export class SlideContainer extends AbsoluteLayout {
    private currentPanel: SlideMap;
    private transitioning: boolean = false;
    private direction: direction = direction.none;
    private _loaded: boolean;
    private _pageWidth: number;
    private _loop: boolean;
    private _pagerOffset: string;
    private _angular: boolean;
    private _disablePan: boolean;
    private _footer: Footer;
    private _pageIndicators: boolean;
    private _slideMap: SlideMap[];
    private _slideWidth: string;

    public static startEvent = 'start';
    public static changedEvent = 'changed';
    public static cancelledEvent = 'cancelled';
    public static finishedEvent = 'finished';

    /* page indicator stuff*/
    public get pageIndicators(): boolean {
        return this._pageIndicators;
    }
    public set pageIndicators(value: boolean) {
        if (typeof value === 'string') {
            value = value == 'true';
        }
        this._pageIndicators = value;
    }

    public get pagerOffset(): string {
        return this._pagerOffset;
    }
    public set pagerOffset(value: string) {
        this._pagerOffset = value;
    }

    public get hasNext(): boolean {
        return !!this.currentPanel && !!this.currentPanel.right;
    }
    public get hasPrevious(): boolean {
        return !!this.currentPanel && !!this.currentPanel.left;
    }

    public get loop(): boolean {
        return this._loop;
    }

    public set loop(value: boolean) {
        this._loop = value;
    }

    public get disablePan(): boolean {
        return this._disablePan;
    }

    public set disablePan(value: boolean) {
        if (this._disablePan === value) {
            return;
        } // Value did not change

        this._disablePan = value;
        if (
            this._loaded &&
            this.currentPanel.panel !== undefined
        ) {
            if (value === true) {
                this.currentPanel.panel.off('pan');
            } else if (value === false) {
                this.applySwipe(this.pageWidth);
            }
        }
    }

    public get pageWidth(): number {
        if (!this.slideWidth) {
            return Platform.screen.mainScreen.widthDIPs;
        }
        return +this.slideWidth;
    }

    public get angular(): boolean {
        return this._angular;
    }

    public set angular(value: boolean) {
        this._angular = value;
    }

    public get currentIndex(): number {
        return this.currentPanel.index;
    }

    public get slideWidth(): string {
        return this._slideWidth;
    }
    public set slideWidth(width: string) {
        this._slideWidth = width;
    }

    public constructor() {
        super();
        this.setupDefaultValues();
        // if being used in an ng2 app we want to prevent it from excuting the constructView
        // until it is called manually in ngAfterViewInit.

        this.constructView(true);
    }

    private setupDefaultValues(): void {
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
    }

    public constructView(constructor: boolean = false): void {
        this.on(
            AbsoluteLayout.loadedEvent,
            (data: EventData) => {
                //// console.log('LOADDED EVENT');
                if (!this._loaded) {
                    this._loaded = true;
                    if (
                        this.angular === true &&
                        constructor === true
                    ) {
                        return;
                    }

                    let slides: StackLayout[] = [];

                    if (!this.slideWidth) {
                        this.slideWidth = String(this.pageWidth);
                    }
                    this.width = +this.slideWidth;

                    this.eachLayoutChild((view: View): void => {
                        if (view instanceof StackLayout) {
                            AbsoluteLayout.setLeft(
                                view,
                                this.pageWidth,
                            );
                            view.width = this.pageWidth;
                            view.height = {
                                unit: '%',
                                value: 100,
                            }; //get around compiler
                            slides.push(view);
                        }
                    });

                    if (this.pageIndicators) {
                        this._footer = this.buildFooter(
                            slides.length,
                            0,
                        );
                        this.setActivePageIndicator(0);
                        this.insertChild(
                            this._footer,
                            this.getChildrenCount(),
                        );
                    }

                    this.currentPanel = this.buildSlideMap(
                        slides,
                    );
                    if (this.currentPanel) {
                        this.positionPanels(this.currentPanel);

                        if (this.disablePan === false) {
                            this.applySwipe(this.pageWidth);
                        }
                        if (app.ios) {
                            this.ios.clipsToBound = true;
                        }
                        //handles application orientation change
                        app.on(
                            app.orientationChangedEvent,
                            (): void => {
                                //event and page orientation didn't seem to alwasy be on the same page so setting it in the time out addresses this.
                                setTimeout(() => {
                                    // console.log('orientationChangedEvent');
                                    this.width = parseInt(
                                        this.slideWidth,
                                    );
                                    this.eachLayoutChild(
                                        (view: View): void => {
                                            if (
                                                view instanceof
                                                StackLayout
                                            ) {
                                                AbsoluteLayout.setLeft(
                                                    view,
                                                    this
                                                        .pageWidth,
                                                );
                                                view.width = this.pageWidth;
                                            }
                                        },
                                    );

                                    if (
                                        this.disablePan === false
                                    ) {
                                        this.applySwipe(
                                            this.pageWidth,
                                        );
                                    }

                                    if (this.pageIndicators) {
                                        AbsoluteLayout.setTop(
                                            this._footer,
                                            0,
                                        );
                                        var pageIndicatorsLeftOffset =
                                            this.pageWidth / 4;
                                        AbsoluteLayout.setLeft(
                                            this._footer,
                                            pageIndicatorsLeftOffset,
                                        );
                                        this._footer.width =
                                            this.pageWidth / 2;
                                        this._footer.marginTop = this
                                            ._pagerOffset as PercentLength;
                                    }

                                    this.positionPanels(
                                        this.currentPanel,
                                    );
                                }, 0);
                            },
                        );
                    }
                }
            },
        );
    }

    public nextSlide(): void {
        if (!this.hasNext) {
            this.triggerCancelEvent(
                cancellationReason.noMoreSlides,
            );
            return;
        }

        this.direction = direction.left;
        this.transitioning = true;
        this.triggerStartEvent();
        this.showRightSlide(this.currentPanel).then(() => {
            this.setupPanel(this.currentPanel.right);
            this.triggerChangeEventRightToLeft();
        });
    }
    public previousSlide(): void {
        if (!this.hasPrevious) {
            this.triggerCancelEvent(
                cancellationReason.noPrevSlides,
            );
            return;
        }

        this.direction = direction.right;
        this.transitioning = true;
        this.triggerStartEvent();
        this.showLeftSlide(this.currentPanel).then(() => {
            this.setupPanel(this.currentPanel.left);
            this.triggerChangeEventLeftToRight();
        });
    }

    private setupPanel(panel: SlideMap) {
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
    }

    private positionPanels(panel: SlideMap) {
        // sets up each panel so that they are positioned to transition either way.
        if (panel.left != null) {
            panel.left.panel.translateX = -this.pageWidth * 2;
        }
        panel.panel.translateX = -this.pageWidth;
        if (panel.right != null) {
            panel.right.panel.translateX = 0;
        }
    }

    public goToSlide(index: number): void {
        if (
            this._slideMap &&
            this._slideMap.length > 0 &&
            index < this._slideMap.length
        ) {
            let previousSlide = this.currentPanel;

            this.setupPanel(this._slideMap[index]);

            this.notify({
                eventName: SlideContainer.changedEvent,
                object: this,
                eventData: {
                    direction: direction.none,
                    newIndex: this.currentPanel.index,
                    oldIndex: previousSlide.index,
                },
            });
        } else {
            // console.log('invalid index');
        }
    }

    public applySwipe(pageWidth: number): void {
        let previousDelta = -1; //hack to get around ios firing pan event after release
        let endingVelocity = 0;

        this.currentPanel.panel.on(
            'pan',
            (args: gestures.PanGestureEventData): void => {
                if (
                    args.state ===
                    gestures.GestureStateTypes.began
                ) {
                    previousDelta = 0;
                    endingVelocity = 250;

                    this.triggerStartEvent();
                } else if (
                    args.state ===
                    gestures.GestureStateTypes.ended
                ) {
                    // if velocityScrolling is enabled then calculate the velocitty

                    // swiping left to right.
                    if (args.deltaX > pageWidth / 3) {
                        if (this.hasPrevious) {
                            this.transitioning = true;
                            this.showLeftSlide(
                                this.currentPanel,
                                args.deltaX,
                                endingVelocity,
                            ).then((): void => {
                                this.setupPanel(
                                    this.currentPanel.left,
                                );

                                this.triggerChangeEventLeftToRight();
                            });
                        } else {
                            //We're at the start
                            //Notify no more slides
                            this.triggerCancelEvent(
                                cancellationReason.noPrevSlides,
                            );
                        }
                        return;
                    }
                    // swiping right to left
                    else if (args.deltaX < -pageWidth / 3) {
                        if (this.hasNext) {
                            this.transitioning = true;
                            this.showRightSlide(
                                this.currentPanel,
                                args.deltaX,
                                endingVelocity,
                            ).then((): void => {
                                this.setupPanel(
                                    this.currentPanel.right,
                                );

                                // Notify changed
                                this.triggerChangeEventRightToLeft();

                                if (!this.hasNext) {
                                    // Notify finsihed
                                    this.notify({
                                        eventName:
                                            SlideContainer.finishedEvent,
                                        object: this,
                                    });
                                }
                            });
                        } else {
                            // We're at the end
                            // Notify no more slides
                            this.triggerCancelEvent(
                                cancellationReason.noMoreSlides,
                            );
                        }
                        return;
                    }

                    if (this.transitioning === false) {
                        //Notify cancelled
                        this.triggerCancelEvent(
                            cancellationReason.user,
                        );
                        this.transitioning = true;
                        this.currentPanel.panel.animate({
                            translate: {
                                x: -this.pageWidth,
                                y: 0,
                            },
                            duration: 200,
                            curve: AnimationCurve.easeOut,
                        });
                        if (this.hasNext) {
                            this.currentPanel.right.panel.animate(
                                {
                                    translate: { x: 0, y: 0 },
                                    duration: 200,
                                    curve:
                                        AnimationCurve.easeOut,
                                },
                            );
                            if (app.ios)
                                //for some reason i have to set these in ios or there is some sort of bounce back.
                                this.currentPanel.right.panel.translateX = 0;
                        }
                        if (this.hasPrevious) {
                            this.currentPanel.left.panel.animate(
                                {
                                    translate: {
                                        x: -this.pageWidth * 2,
                                        y: 0,
                                    },
                                    duration: 200,
                                    curve:
                                        AnimationCurve.easeOut,
                                },
                            );
                            if (app.ios)
                                this.currentPanel.left.panel.translateX = -this
                                    .pageWidth;
                        }
                        if (app.ios)
                            this.currentPanel.panel.translateX = -this
                                .pageWidth;

                        this.transitioning = false;
                    }
                } else {
                    if (
                        !this.transitioning &&
                        previousDelta !== args.deltaX &&
                        args.deltaX != null &&
                        args.deltaX < 0
                    ) {
                        if (this.hasNext) {
                            this.direction = direction.left;
                            this.currentPanel.panel.translateX =
                                args.deltaX - this.pageWidth;
                            this.currentPanel.right.panel.translateX =
                                args.deltaX;
                        }
                    } else if (
                        !this.transitioning &&
                        previousDelta !== args.deltaX &&
                        args.deltaX != null &&
                        args.deltaX > 0
                    ) {
                        if (this.hasPrevious) {
                            this.direction = direction.right;
                            this.currentPanel.panel.translateX =
                                args.deltaX - this.pageWidth;
                            this.currentPanel.left.panel.translateX =
                                -(this.pageWidth * 2) +
                                args.deltaX;
                        }
                    }

                    if (args.deltaX !== 0) {
                        previousDelta = args.deltaX;
                    }
                }
            },
        );
    }

    private showRightSlide(
        panelMap: SlideMap,
        offset: number = this.pageWidth,
        endingVelocity: number = 32,
    ): AnimationModule.AnimationPromise {
        let animationDuration: number;
        animationDuration = 300; // default value

        let transition = [];

        transition.push({
            target: panelMap.right.panel,
            translate: { x: -this.pageWidth, y: 0 },
            duration: animationDuration,
            curve: AnimationCurve.easeOut,
        });
        transition.push({
            target: panelMap.panel,
            translate: { x: -this.pageWidth * 2, y: 0 },
            duration: animationDuration,
            curve: AnimationCurve.easeOut,
        });
        let animationSet = new AnimationModule.Animation(
            transition,
            false,
        );

        return animationSet.play();
    }

    private showLeftSlide(
        panelMap: SlideMap,
        offset: number = this.pageWidth,
        endingVelocity: number = 32,
    ): AnimationModule.AnimationPromise {
        let animationDuration: number;
        animationDuration = 300; // default value
        let transition = [];

        transition.push({
            target: panelMap.left.panel,
            translate: { x: -this.pageWidth, y: 0 },
            duration: animationDuration,
            curve: AnimationCurve.easeOut,
        });
        transition.push({
            target: panelMap.panel,
            translate: { x: 0, y: 0 },
            duration: animationDuration,
            curve: AnimationCurve.easeOut,
        });
        let animationSet = new AnimationModule.Animation(
            transition,
            false,
        );

        return animationSet.play();
    }

    private buildFooter(
        pageCount: number = 5,
        activeIndex: number = 0,
    ): Footer {
        let footerInnerWrap = new StackLayout();

        //footerInnerWrap.height = 50;
        if (app.ios) {
            footerInnerWrap.clipToBounds = false;
        }
        footerInnerWrap.className = SLIDE_INDICATOR_WRAP;

        AbsoluteLayout.setTop(footerInnerWrap, 0);

        footerInnerWrap.orientation = 'horizontal';
        footerInnerWrap.horizontalAlignment = 'center';
        footerInnerWrap.width = this.pageWidth / 2;

        let index = 0;
        while (index < pageCount) {
            footerInnerWrap.addChild(
                this.createIndicator(index),
            );
            index++;
        }

        let pageIndicatorsLeftOffset = this.pageWidth / 4;
        AbsoluteLayout.setLeft(
            footerInnerWrap,
            pageIndicatorsLeftOffset,
        );
        footerInnerWrap.marginTop = this
            ._pagerOffset as PercentLength;

        return footerInnerWrap as Footer;
    }

    private setwidthPercent(view: View, percentage: number) {
        view.width = (percentage + '%') as PercentLength;
    }

    private newFooterButton(name: string): Button {
        let button = new Button();
        button.id = 'btn-info-' + name.toLowerCase();
        button.text = name;
        this.setwidthPercent(button, 100);
        return button;
    }

    private buildSlideMap(views: StackLayout[]): SlideMap {
        this._slideMap = [];
        views.forEach(
            (view: StackLayout, index: number): void => {
                this._slideMap.push({
                    panel: view,
                    index: index,
                });
            },
        );
        this._slideMap.forEach(
            (mapping: SlideMap, index: number): void => {
                if (this._slideMap[index - 1] != null)
                    mapping.left = this._slideMap[index - 1];
                if (this._slideMap[index + 1] != null)
                    mapping.right = this._slideMap[index + 1];
            },
        );

        if (this.loop === true) {
            this._slideMap[0].left = this._slideMap[
                this._slideMap.length - 1
            ];
            this._slideMap[
                this._slideMap.length - 1
            ].right = this._slideMap[0];
        }
        return this._slideMap[0];
    }

    private triggerStartEvent() {
        this.notify({
            eventName: SlideContainer.startEvent,
            object: this,
            eventData: {
                currentIndex: this.currentPanel.index,
            },
        });
    }

    private triggerChangeEventLeftToRight() {
        this.notify({
            eventName: SlideContainer.changedEvent,
            object: this,
            eventData: {
                direction: direction.left,
                newIndex: this.currentPanel.index,
                oldIndex: this.currentPanel.index + 1,
            },
        });
    }

    private triggerChangeEventRightToLeft() {
        this.notify({
            eventName: SlideContainer.changedEvent,
            object: this,
            eventData: {
                direction: direction.right,
                newIndex: this.currentPanel.index,
                oldIndex: this.currentPanel.index - 1,
            },
        });
    }

    private triggerCancelEvent(
        cancelReason: cancellationReason,
    ): void {
        this.notify({
            eventName: SlideContainer.cancelledEvent,
            object: this,
            eventData: {
                currentIndex: this.currentPanel.index,
                reason: cancelReason,
            },
        });
    }

    public createIndicator(index: number): Label {
        const indicator = new Label();

        indicator.cssClasses.add(SLIDE_INDICATOR_INACTIVE);
        return indicator;
    }

    public setActivePageIndicator(index: number): void {
        let indicatorsToDeactivate = this._footer.getElementsByClassName(
            SLIDE_INDICATOR_ACTIVE,
        );

        indicatorsToDeactivate.forEach(
            (activeIndicator): void => {
                activeIndicator.classList.remove(
                    SLIDE_INDICATOR_ACTIVE,
                );
                activeIndicator.classList.add(
                    SLIDE_INDICATOR_INACTIVE,
                );
            },
        );

        let activeIndicator = this._footer.getElementsByClassName(
            SLIDE_INDICATOR_INACTIVE,
        )[index];
        if (activeIndicator) {
            activeIndicator.classList.remove(
                SLIDE_INDICATOR_INACTIVE,
            );
            activeIndicator.classList.add(
                SLIDE_INDICATOR_ACTIVE,
            );
        }
    }

    public iosProperty(theClass, theProperty): unknown {
        if (typeof theProperty === 'function') {
            // xCode 7 and below
            return theProperty.call(theClass);
        } else {
            // xCode 8+
            return theProperty;
        }
    }
}
