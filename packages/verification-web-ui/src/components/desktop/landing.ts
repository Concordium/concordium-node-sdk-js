import arrowRight from '@/assets/arrow-right.svg';
import concordiumModalLogo from '@/assets/concordium-modal-logo.svg';
import trustLogos from '@/assets/trust-logos.svg';
import slide1 from '@/assets/slide1.mp4';
import slide2 from '@/assets/slide2.mp4';
import slide3 from '@/assets/slide3.mp4';

import type {
  CarouselItem,
  ModalFunction,
  ShowModalFunction,
  HideModalFunction,
} from '@/types';
import { createCarousel } from '@/utils/carousel';
import { getGlobalContainer, getConfig } from '@/index';

const carouselItems: CarouselItem[] = [
  {
    image: slide1,
    alt: 'locked-graphic',
    title: 'Anonymous Verification that keeps your data safe',
    points: [],
  },
  {
    image: slide2,
    alt: 'verification-graphic',
    title: 'Common online verification exposes your data ',
    reduceOpacity: true,
    points: [
      { icon: 'exclamation', text: 'Personal data shared' },
      { icon: 'exclamation', text: 'Stored on remote servers' },
    ],
  },
  {
    image: slide3,
    alt: 'secure-graphic',
    title: 'Verify and stay anonymous',
    reduceOpacity: false,
    points: [
      { icon: 'check', text: 'No personal data shared' },
      { icon: 'check', text: 'Not exposed' },
      { icon: 'check', text: 'Not in the cloud' },
    ],
  },
];

export const createLandingModal: ModalFunction = () => {
  const landingHTML = `
    <div class="desktop--modal-overlay">
      <div class="desktop--modal-container">
        <div class="desktop--modal-body">
          <div class="flex items-center justify-end p-1 md:p-2">
            <img
              src="${concordiumModalLogo}"
              alt="concordium-modal-logo"
              class="max-w-full h-auto"
            />
          </div>

          <div class="desktop--carousel-container" data-carousel>
            <div class="desktop--carousel-wrapper" data-carousel-wrapper>
              <div class="desktop--carousel-track" data-carousel-track>
                ${carouselItems
                  .map(
                    item => `
                  <div class="desktop--carousel-image">
                    <div class="flex items-center justify-center h-full">
                      <video autoplay loop muted playsinline class="max-w-full h-auto max-h-full" style="object-fit: contain;">
                        <source src="${item.image}" type="video/mp4" />
                      </video>
                    </div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>

            <div class="desktop--carousel-actions">
              ${carouselItems
                .map(
                  (_, index) => `
                <div 
                  class="desktop--carousel-action-item ${
                    index === 0 ? 'active' : ''
                  }" 
                  data-carousel-bullet
                  data-index="${index}"
                ></div>
              `
                )
                .join('')}
            </div>
          </div>

          <div class="flex flex-col items-center gap-3 md:gap-4">
            <button class="desktop--primary-button" id="start-verification-btn">
              <span>Start Anonymous Verification</span>
              <img src="${arrowRight}" alt="arrow-right-icon" />
            </button>
          </div>

          <div class="w-full max-w-[320px] mx-auto border border-muted"></div>

          <div class="flex items-center justify-center">
            <img src="${trustLogos}" alt="trust-logos" class="max-w-full h-auto" />
          </div>
        </div>
      </div>
    </div>
  `;

  const landingContainer = document.createElement('div');
  landingContainer.innerHTML = landingHTML;

  // Initialize carousel with your existing DOM structure
  const carouselContainer = landingContainer.querySelector(
    '[data-carousel]'
  ) as HTMLElement | null;

  if (carouselContainer) {
    // Initialize carousel
    createCarousel(carouselContainer, {
      autoPlayInterval: 5000,
      enableAutoPlay: true,
      enableSwipe: true,
    });
  }

  // Add event listener for the start verification button
  const startBtn = landingContainer.querySelector(
    '#start-verification-btn'
  ) as HTMLButtonElement | null;
  startBtn?.addEventListener('click', async () => {
    const { showScanModal } = await import('./scan');
    const { hideLandingModal } = await import('./landing');
    hideLandingModal();
    await showScanModal();
  });

  return landingContainer;
};

export const showLandingModal: ShowModalFunction = async () => {
  // Ensure DOM is ready before resolving container
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    });
  }

  // Resolve container with retries (similar to initConcordiumModal)
  let targetContainer = getGlobalContainer();

  // If still not found, wait a bit and try again (for React apps that might still be mounting)
  if (!targetContainer) {
    await new Promise(resolve => setTimeout(resolve, 100));
    targetContainer = getGlobalContainer();
  }

  if (!targetContainer) {
    console.error('Container not found for modal');
    console.error(
      `Container not found for Concordium modal. Tried: ${getConfig().defaultContainer}`
    );
    console.error('Available elements:', {
      root: document.querySelector('#root'),
      app: document.querySelector('#app'),
      body: document.body,
    });
    return;
  }

  // Prevent horizontal scrolling on body
  document.body.style.overflowX = 'hidden';

  // Find existing modal to crossfade
  const existingModal = targetContainer.querySelector(
    '.desktop--modal-overlay'
  ) as HTMLElement | null;

  const landing = createLandingModal();
  landing.id = 'landing-modal';

  // Get the modal container for transforms
  const modalContainer = landing.querySelector(
    '.desktop--modal-container'
  ) as HTMLElement;

  // For smooth transitions, prepare new modal completely before showing
  landing.style.opacity = '0';
  modalContainer.style.transform = 'translateY(-20px) scale(0.95)';
  modalContainer.style.transition = 'transform 0.3s ease-out';
  targetContainer.appendChild(landing);

  // Force a reflow to ensure the styles are applied
  landing.offsetHeight;

  // Now start the transition
  landing.style.transition = 'opacity 0.3s ease-out';

  // Use a small delay to ensure DOM is fully ready
  setTimeout(() => {
    // Start simultaneous crossfade
    if (existingModal) {
      const existingContainer = existingModal.querySelector(
        '.desktop--modal-container'
      ) as HTMLElement;
      existingModal.style.transition = 'opacity 0.3s ease-in';
      if (existingContainer) {
        existingContainer.style.transition = 'transform 0.3s ease-in';
        existingContainer.style.transform = 'translateY(-20px) scale(0.95)';
      }
      existingModal.style.opacity = '0';
      existingModal.style.pointerEvents = 'none';
      existingModal.style.zIndex = '9998';
    }

    // Show new modal
    landing.style.opacity = '1';
    modalContainer.style.transform = 'translateY(0) scale(1)';

    // Remove old modal after transition completes
    if (existingModal) {
      setTimeout(() => {
        if (existingModal.parentNode) {
          existingModal.parentNode.removeChild(existingModal);
        }
      }, 350);
    }
  }, 10);
};

export const hideLandingModal: HideModalFunction = () => {
  const modal = document.querySelector('#landing-modal') as HTMLElement | null;
  if (modal) {
    // Add fade-out animation
    modal.classList.add('modal-exiting');

    // Cleanup carousel
    const container = modal.querySelector('[data-carousel]');
    if (container && (container.parentElement as any)?.carouselInstance) {
      (container.parentElement as any).carouselInstance.destroy();
    }

    // Remove after animation completes
    setTimeout(() => {
      modal.remove();
      // Restore body overflow if no other modals are present
      if (
        !document.querySelector('.desktop--modal-overlay') &&
        !document.querySelector('.mobile--modal-overlay')
      ) {
        document.body.style.overflowX = '';
      }
    }, 300);
  }
};
