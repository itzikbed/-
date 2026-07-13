type PlaybackControls = {
  play: () => void;
  pause: () => void;
  element: HTMLVideoElement;
};

class PlaybackDirectorClass {
  private registry = new Map<string, PlaybackControls>();
  private activeId: string | null = null;
  private observer: IntersectionObserver | null = null;
  private isMobile = false;

  constructor() {
    if (typeof window === 'undefined') return;

    // Listen to document visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAll();
      } else {
        this.triggerUpdate();
      }
    });

    const checkMobile = () => {
      this.isMobile = window.innerWidth < 768;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Initialize IntersectionObserver for mobile card center-tracking
    this.observer = new IntersectionObserver(() => {
      if (!this.isMobile) return;
      this.triggerMobileUpdate();
    }, {
      threshold: [0, 0.25, 0.5, 0.75, 1],
      rootMargin: '-10% 0px -10% 0px'
    });
  }

  public register(id: string, element: HTMLVideoElement, controls: Omit<PlaybackControls, 'element'>) {
    this.registry.set(id, { ...controls, element });
    
    // For mobile, observe the closest parent card element
    if (this.observer) {
      const cardEl = element.closest('[data-cat-card]') || element.closest('[data-hero-section]');
      if (cardEl) {
        this.observer.observe(cardEl);
      }
    }

    // Trigger update in case it was registered while visible
    setTimeout(() => this.triggerUpdate(), 100);
  }

  public unregister(id: string) {
    const controls = this.registry.get(id);
    if (controls && this.observer) {
      const cardEl = controls.element.closest('[data-cat-card]') || controls.element.closest('[data-hero-section]');
      if (cardEl) {
        this.observer.unobserve(cardEl);
      }
    }
    this.registry.delete(id);
    if (this.activeId === id) {
      this.activeId = null;
    }
  }

  public playSingle(id: string) {
    if (typeof window === 'undefined' || document.hidden) return;

    // If another video is active, pause it
    if (this.activeId && this.activeId !== id) {
      const activeControls = this.registry.get(this.activeId);
      if (activeControls) {
        activeControls.pause();
      }
    }

    // Play the requested video
    const controls = this.registry.get(id);
    if (controls) {
      controls.play();
      this.activeId = id;
    }
  }

  public pauseSingle(id: string) {
    if (this.activeId === id) {
      const controls = this.registry.get(id);
      if (controls) {
        controls.pause();
      }
      this.activeId = null;
      
      // On desktop, if the card stops playing, and hero is visible, resume hero
      if (!this.isMobile) {
        this.resumeHeroIfVisible();
      }
    }
  }

  public pauseAll() {
    this.registry.forEach((controls) => {
      controls.pause();
    });
    this.activeId = null;
  }

  public triggerUpdate() {
    if (this.isMobile) {
      this.triggerMobileUpdate();
    } else {
      this.resumeHeroIfVisible();
    }
  }

  private resumeHeroIfVisible() {
    // If we're on desktop, and no card is playing, play hero if visible
    if (this.activeId && this.activeId !== 'hero') return;
    
    const heroControls = this.registry.get('hero');
    if (heroControls) {
      const rect = heroControls.element.getBoundingClientRect();
      const isVisible = rect.bottom > 0 && rect.top < window.innerHeight;
      if (isVisible) {
        this.playSingle('hero');
      } else {
        this.pauseSingle('hero');
      }
    }
  }

  private triggerMobileUpdate() {
    if (typeof window === 'undefined') return;
    
    // Find all visible card elements or hero sections
    const elements = Array.from(document.querySelectorAll('[data-cat-card], [data-hero-section]'));
    let closestId: string | null = null;
    let minDistance = Infinity;
    const centerY = window.innerHeight / 2;

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const elCenterY = rect.top + rect.height / 2;
        const distance = Math.abs(elCenterY - centerY);
        
        let id: string | null = null;
        if (el.hasAttribute('data-hero-section')) {
          id = 'hero';
        } else {
          id = el.getAttribute('data-cat-card-id');
        }

        if (id && this.registry.has(id) && distance < minDistance) {
          minDistance = distance;
          closestId = id;
        }
      }
    });

    if (closestId) {
      this.playSingle(closestId);
    } else {
      this.pauseAll();
    }
  }
}

export const PlaybackDirector = new PlaybackDirectorClass();
