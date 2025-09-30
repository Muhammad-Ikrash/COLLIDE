import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Define theme types for type safety
type Theme = 'dark' | 'light';

// Key for storing the user's preference in the browser's local storage
const STORAGE_KEY = 'collide-theme-preference';

@Injectable({ providedIn: 'root' })
export class ThemingService {
    
    // 1. Initialize the theme from localStorage, or default to 'dark'
    private readonly initialTheme: Theme = 
        (localStorage.getItem(STORAGE_KEY) as Theme) || 'dark';
    
    // 2. Theme state subject: holds the current theme and emits changes
    private readonly _currentTheme = new BehaviorSubject<Theme>(this.initialTheme);
    public readonly currentTheme$: Observable<Theme> = this._currentTheme.asObservable();

    constructor() {
        // Apply the initial theme class immediately upon service instantiation
        this.applyThemeToBody(this.initialTheme);
    }

    /**
     * Toggles the theme between 'dark' and 'light'.
     */
    public toggleTheme(): void {
        const newTheme: Theme = this._currentTheme.value === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    /**
     * Sets a specific theme, updates state, and persists the preference.
     * @param theme The theme to set ('dark' or 'light').
     */
    public setTheme(theme: Theme): void {
        // 1. Update the body class to apply the new SCSS rules
        this.applyThemeToBody(theme);
        
        // 2. Persist the user's preference
        localStorage.setItem(STORAGE_KEY, theme);
        
        // 3. Update the observable stream
        this._currentTheme.next(theme);
    }
    
    /**
     * Retrieves the current theme from the BehaviorSubject.
     */
    public getCurrentTheme(): Theme {
        return this._currentTheme.value;
    }

    /**
     * Manages adding and removing the correct theme class on the document body.
     * @param theme The theme to apply.
     */
    private applyThemeToBody(theme: Theme): void {
        const body = document.body;
        
        // 1. Ensure any existing theme class is removed
        body.classList.remove('theme-dark', 'theme-light');
        
        // 2. Add the new theme class (e.g., 'theme-dark')
        body.classList.add(`theme-${theme}`);
    }
}