import { IThemeColors } from './IOptions';

type ThemeMap = Record<string, IThemeColors>;

class ThemeManager {
  colors: ThemeMap;
  theme: IThemeColors;

  constructor(colors: ThemeMap, theme: string) {
    this.colors = colors;
    this.theme = this.colors[theme];
  }

  /**
   * Returns the hex code of a color associated with a key from the current theme.
   *
   * @param {String} key The color key in the theme (e.g. C, N, BACKGROUND, ...).
   * @returns {String} A color hex value.
   */
  getColor(key: string | null | undefined): string {
    if (key) {
      key = key.toUpperCase();

      if (key in this.theme) {
        return this.theme[key];
      }
    }

    return this.theme['C'];
  }

  /**
   * Sets the theme to the specified string if it exists. If it does not, this
   * does nothing.
   *
   * @param {String} theme the name of the theme to switch to
   */
  setTheme(theme: string): void {
    if (this.colors.hasOwnProperty(theme)) {
      this.theme = this.colors[theme];
    }

    // TODO: this probably should notify those who are watching this theme
    // manager that the theme has changed so that colors can be changed
    // on the fly
  }

  getHighlightColor(fallback?: string): string {
    if (this.theme && typeof this.theme.HIGHLIGHT === 'string' && this.theme.HIGHLIGHT.length > 0) {
      return this.theme.HIGHLIGHT;
    }

    return fallback ?? this.getColor('C');
  }
}

export = ThemeManager;
