import type { CarouselOptions } from '../types';

export class Carousel {
  private options: Required<CarouselOptions>;
  private track: HTMLElement | null;
  private wrapper: HTMLElement | null;
  private bullets: NodeListOf<HTMLElement>;
  private currentIndex: number = 0;
  private totalItems: number;
  private startX: number = 0;
  private currentX: number = 0;
  private isDragging: boolean = false;
  private autoPlayInterval: ReturnType<typeof setInterval> | null = null;

  constructor(container: HTMLElement, options: CarouselOptions = {}) {
    this.options = {
      autoPlayInterval: options.autoPlayInterval || 3000,
      transitionDuration: options.transitionDuration || 300,
      swipeThreshold: options.swipeThreshold || 0.2,
      enableAutoPlay: options.enableAutoPlay !== false,
      enableSwipe: options.enableSwipe !== false,
      onSlideChange: options.onSlideChange || (() => {}),
    };

    this.track = container.querySelector('[data-carousel-track]');
    this.wrapper = container.querySelector('[data-carousel-wrapper]');
    this.bullets = container.querySelectorAll('[data-carousel-bullet]');

    this.totalItems = this.bullets.length;

    this.init();
  }

  private init(): void {
    if (!this.track || !this.wrapper || this.totalItems === 0) {
      console.error('Carousel: Required elements not found');
      return;
    }

    this.setupEventListeners();

    if (this.options.enableAutoPlay) {
      this.startAutoPlay();
    }

    this.updateCarousel(0, false);
  }

  private setupEventListeners(): void {
    if (this.options.enableSwipe && this.wrapper) {
      this.wrapper.addEventListener('mousedown', this.handleStart.bind(this));
      this.wrapper.addEventListener('mousemove', this.handleMove.bind(this));
      this.wrapper.addEventListener('mouseup', this.handleEnd.bind(this));
      this.wrapper.addEventListener('mouseleave', this.handleEnd.bind(this));

      this.wrapper.addEventListener('touchstart', this.handleStart.bind(this), {
        passive: true,
      });
      this.wrapper.addEventListener('touchmove', this.handleMove.bind(this), {
        passive: false,
      });
      this.wrapper.addEventListener('touchend', this.handleEnd.bind(this));
    }

    this.bullets.forEach((bullet, index) => {
      bullet.addEventListener('click', () => {
        this.goToSlide(index);
      });
    });
  }

  private handleStart(e: MouseEvent | TouchEvent): void {
    this.isDragging = true;
    this.startX = this.getEventX(e);
    this.currentX = this.startX;
    this.stopAutoPlay();
    if (this.track) {
      this.track.style.transition = 'none';
    }
  }

  private handleMove(e: MouseEvent | TouchEvent): void {
    if (!this.isDragging || !this.track || !this.wrapper) return;

    e.preventDefault();
    this.currentX = this.getEventX(e);
    const diff = this.currentX - this.startX;
    const offset =
      -this.currentIndex * 100 + (diff / this.wrapper.offsetWidth) * 100;
    this.track.style.transform = `translateX(${offset}%)`;
  }

  private handleEnd(): void {
    if (!this.isDragging || !this.wrapper) return;

    this.isDragging = false;
    const diff = this.currentX - this.startX;
    const threshold = this.wrapper.offsetWidth * this.options.swipeThreshold;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        this.prev();
      } else {
        this.next();
      }
    } else {
      this.updateCarousel(this.currentIndex);
    }

    if (this.options.enableAutoPlay) {
      this.startAutoPlay();
    }
  }

  private getEventX(e: MouseEvent | TouchEvent): number {
    if (e.type.includes('mouse')) {
      return (e as MouseEvent).clientX;
    } else {
      return (e as TouchEvent).touches[0].clientX;
    }
  }

  private updateCarousel(index: number, smooth: boolean = true): void {
    const previousIndex = this.currentIndex;
    const newIndex = (index + this.totalItems) % this.totalItems;

    if (smooth && previousIndex !== newIndex) {
      this.bullets[previousIndex]?.classList.remove('active');
      this.bullets[previousIndex]?.classList.add('next');

      setTimeout(() => {
        this.bullets[previousIndex]?.classList.remove('next');
        this.bullets[newIndex]?.classList.add('active');
      }, this.options.transitionDuration);
    } else {
      this.bullets.forEach((bullet, i) => {
        bullet.classList.remove('active', 'next');
        if (i === newIndex) {
          bullet.classList.add('active');
        }
      });
    }

    this.currentIndex = newIndex;
    const offset = -this.currentIndex * 100;

    if (this.track) {
      this.track.style.transition = smooth
        ? `transform ${this.options.transitionDuration}ms ease-out`
        : 'none';
      this.track.style.transform = `translateX(${offset}%)`;
    }

    this.options.onSlideChange(this.currentIndex);
  }

  public next(): void {
    this.updateCarousel(this.currentIndex + 1);
  }

  public prev(): void {
    this.updateCarousel(this.currentIndex - 1);
  }

  public goToSlide(index: number): void {
    this.stopAutoPlay();
    this.updateCarousel(index);
    if (this.options.enableAutoPlay) {
      this.startAutoPlay();
    }
  }

  public startAutoPlay(): void {
    this.stopAutoPlay();
    this.autoPlayInterval = setInterval(() => {
      this.next();
    }, this.options.autoPlayInterval);
  }

  public stopAutoPlay(): void {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  public destroy(): void {
    this.stopAutoPlay();
    if (this.wrapper) {
      this.wrapper.replaceWith(this.wrapper.cloneNode(true));
    }
  }
}

// Function-based exports for compatibility with your landing modal imports
let currentCarouselInstance: Carousel | null = null;

export function createCarousel(
  container: HTMLElement,
  options: CarouselOptions = {}
): Carousel {
  // Cleanup any existing instance
  destroyCarousel();

  // Create new carousel instance
  currentCarouselInstance = new Carousel(container, options);
  return currentCarouselInstance;
}

export function destroyCarousel(): void {
  if (currentCarouselInstance) {
    currentCarouselInstance.destroy();
    currentCarouselInstance = null;
  }
}

// Re-export types for convenience
export type { CarouselOptions };
