// dropdown.ts - Reusable Dropdown Utility
import chevronUpDownIcon from '@/assets/chevron-up-down.svg';

import type { DropdownConfig, WalletOption } from '../types';

// Constants
const DROPDOWN_SELECTORS = {
    TRIGGER: '[data-dropdown-trigger]',
    MENU: '[data-dropdown-menu]',
    LIST: '[data-dropdown-list]',
    SELECTED_TEXT: '[data-dropdown-selected-text]',
    SELECTED_ICON: '[data-dropdown-selected-icon]',
    RADIO_BUTTONS: 'input[type="radio"][name="wallet"]',
} as const;

const DROPDOWN_CLASSES = {
    VISIBLE: ['opacity-100', 'visible'],
    HIDDEN: ['opacity-0', 'invisible'],
} as const;

// Default configuration
const DEFAULT_CONFIG: Required<Omit<DropdownConfig, 'onSelect'>> = {
    containerClass: 'w-full max-w-[360px] mx-auto relative',
    triggerClass:
        'w-full bg-dropdown-item border border-dropdown-border rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-opacity-80 transition-colors',
    menuClass:
        'flex flex-col absolute -top-[20%] w-full mt-2 border border-muted bg-white rounded-[16px] gap-[4px] shadow-xl overflow-hidden opacity-0 invisible transition-all duration-300 z-10 p-2 box-border',
    optionClass:
        'flex items-center gap-2 bg-dropdown-item px-4 py-3 cursor-pointer hover:bg-opacity-80 transition-colors border-b border-gray-200 rounded-[16px]',
    lastOptionClass:
        'flex items-center gap-2 bg-dropdown-item px-4 py-3 cursor-pointer hover:bg-opacity-80 transition-colors rounded-[16px]',
};

interface DropdownElements {
    trigger: HTMLElement | null;
    menu: HTMLElement | null;
    selectedText: HTMLElement | null;
    selectedIcon: HTMLImageElement | null;
    radioButtons: NodeListOf<HTMLInputElement>;
    dropdownList: HTMLElement | null;
}

/**
 * Dropdown Class - Reusable dropdown component
 */
export class Dropdown {
    private container: HTMLElement;
    private options: DropdownConfig;
    private elements: DropdownElements;
    private isOpen: boolean = false;
    private boundHandlers: Record<string, (e: Event) => void> = {};

    constructor(container: HTMLElement, options: DropdownConfig = {}) {
        this.container = container;
        this.options = {
            onSelect: options.onSelect,
            ...options,
        };

        this.elements = {
            trigger: container.querySelector(DROPDOWN_SELECTORS.TRIGGER),
            menu: container.querySelector(DROPDOWN_SELECTORS.MENU),
            selectedText: container.querySelector(DROPDOWN_SELECTORS.SELECTED_TEXT),
            selectedIcon: container.querySelector(DROPDOWN_SELECTORS.SELECTED_ICON) as HTMLImageElement | null,
            radioButtons: container.querySelectorAll(DROPDOWN_SELECTORS.RADIO_BUTTONS),
            dropdownList: container.querySelector(DROPDOWN_SELECTORS.LIST),
        };

        this.init();
    }

    private init(): void {
        if (!this.elements.trigger || !this.elements.menu) {
            console.error('Required dropdown elements not found in container');
            return;
        }

        this.setupEventListeners();
    }

    // Utility function to toggle classes efficiently
    private toggleClasses(element: HTMLElement, remove: readonly string[], add: readonly string[]): void {
        element.classList.remove(...remove);
        element.classList.add(...add);
    }

    // Open dropdown
    private open(): void {
        this.isOpen = true;
        if (this.elements.menu) {
            this.toggleClasses(this.elements.menu, DROPDOWN_CLASSES.HIDDEN, DROPDOWN_CLASSES.VISIBLE);
        }
    }

    // Close dropdown
    private close(): void {
        this.isOpen = false;
        if (this.elements.menu) {
            this.toggleClasses(this.elements.menu, DROPDOWN_CLASSES.VISIBLE, DROPDOWN_CLASSES.HIDDEN);
        }
    }

    // Toggle dropdown
    private toggle(e?: Event): void {
        e?.stopPropagation();
        this.isOpen ? this.close() : this.open();
    }

    // Handle selection
    private handleSelection(e: Event): void {
        const { target } = e;
        if (!(target instanceof HTMLInputElement)) return;

        const label = target.closest('label');
        if (!label) return;

        const text = label.querySelector('span')?.textContent;
        const iconSrc = target.dataset.icon;

        // Update selected display
        if (this.elements.selectedText && text) {
            this.elements.selectedText.textContent = text;
        }
        if (this.elements.selectedIcon && iconSrc) {
            this.elements.selectedIcon.src = iconSrc;
            this.elements.selectedIcon.alt = text || '';
        }

        this.close();

        // Execute callback if provided
        if (this.options.onSelect) {
            this.options.onSelect({
                value: target.value,
                text: text || '',
                icon: iconSrc || '',
                checked: target.checked,
            });
        }
    }

    // Click outside handler
    private handleClickOutside(e: Event): void {
        if (
            this.elements.dropdownList &&
            e.target instanceof Node &&
            !this.elements.dropdownList.contains(e.target) &&
            this.isOpen
        ) {
            this.close();
        }
    }

    // Event listeners setup
    private setupEventListeners(): void {
        // Bind handlers to maintain context
        this.boundHandlers.toggle = this.toggle.bind(this);
        this.boundHandlers.selection = this.handleSelection.bind(this);
        this.boundHandlers.clickOutside = this.handleClickOutside.bind(this);

        this.elements.trigger?.addEventListener('click', this.boundHandlers.toggle);

        this.elements.radioButtons.forEach((radio) => {
            radio.addEventListener('change', this.boundHandlers.selection);
        });

        // Use requestAnimationFrame for better performance
        requestAnimationFrame(() => {
            document.addEventListener('click', this.boundHandlers.clickOutside);
        });
    }

    // Get current state
    public getState(): { isOpen: boolean; selectedValue: string | null } {
        return {
            isOpen: this.isOpen,
            selectedValue: this.getSelectedValue(),
        };
    }

    // Get selected value
    public getSelectedValue(): string | null {
        const selectedRadio = this.container.querySelector(
            DROPDOWN_SELECTORS.RADIO_BUTTONS + ':checked'
        ) as HTMLInputElement | null;
        return selectedRadio ? selectedRadio.value : null;
    }

    // Cleanup function following your modal system cleanup patterns
    public destroy(): void {
        // Remove event listeners safely
        if (this.boundHandlers.toggle && this.elements.trigger) {
            this.elements.trigger.removeEventListener('click', this.boundHandlers.toggle);
        }

        if (this.boundHandlers.selection && this.elements.radioButtons) {
            this.elements.radioButtons.forEach((radio) => {
                radio.removeEventListener('change', this.boundHandlers.selection);
            });
        }

        if (this.boundHandlers.clickOutside) {
            document.removeEventListener('click', this.boundHandlers.clickOutside);
        }

        // Clear references following your cleanup pattern
        this.boundHandlers = {};

        // Reset elements to safe state - avoid empty querySelectorAll
        this.elements = {
            trigger: null,
            menu: null,
            selectedText: null,
            selectedIcon: null,
            radioButtons: document.createDocumentFragment().querySelectorAll('input') as NodeListOf<HTMLInputElement>,
            dropdownList: null,
        };

        // Clear container reference
        (this.container as any) = null;
    }
}

/**
 * Create dropdown option HTML
 */
function createOptionHTML(
    option: WalletOption,
    index: number,
    total: number,
    config: Required<Omit<DropdownConfig, 'onSelect'>>
): string {
    const isLast = index === total - 1;
    const className = isLast ? config.lastOptionClass : config.optionClass;
    const checked = option.checked ? 'checked' : '';

    return `
    <label class="${className}">
      <img src="${option.icon}" alt="${option.text}" class="h-8 w-8" />
      <span class="font-inter font-medium text-[16px] leading-4" style="color: #0D0F11;">${option.text}</span>
      <input type="radio" name="wallet" value="${option.value}" data-icon="${option.icon}" class="hidden" ${checked}>
    </label>`;
}

/**
 * Create dropdown HTML structure
 */
export function createDropdownHTML(options: WalletOption[], userConfig: DropdownConfig = {}): string {
    if (!Array.isArray(options) || options.length === 0) {
        console.error('Invalid options provided to createDropdownHTML');
        return '';
    }

    const config = { ...DEFAULT_CONFIG, ...userConfig };
    const selectedOption = options.find((opt) => opt.checked) || options[0];

    const optionsHTML = options
        .map((option, index) => createOptionHTML(option, index, options.length, config))
        .join('');

    return `
    <div data-dropdown-list class="${config.containerClass}">
      <button data-dropdown-trigger class="${config.triggerClass}">
        <span class="flex items-center gap-2">
          <img data-dropdown-selected-icon src="${selectedOption.icon}" alt="${selectedOption.text}" class="h-8 w-8" />
          <span data-dropdown-selected-text class="font-inter font-medium text-[16px] leading-4" style="color: #0D0F11;">${selectedOption.text}</span>
        </span>
        <span>
          <img data-dropdown-arrow src="${chevronUpDownIcon}" alt="chevron-up-down-icon" class="transition-transform" />
        </span>
      </button>
      <div data-dropdown-menu class="${config.menuClass}">
        ${optionsHTML}
      </div>
    </div>`;
}
