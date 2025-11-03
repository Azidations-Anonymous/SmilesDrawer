import getDefaultOptions from "./DefaultOptions";
import Options = require('./Options');
import { IMoleculeOptions, IThemeColors } from './IOptions';

class OptionsManager {
    private defaultOptions: IMoleculeOptions;
    opts: IMoleculeOptions;
    theme: IThemeColors;

    constructor(userOptions: Partial<IMoleculeOptions>) {
        this.defaultOptions = getDefaultOptions();

            this.opts = Options.extend<IMoleculeOptions>(true, this.defaultOptions, userOptions);
            this.opts.halfBondSpacing = this.opts.bondSpacing / 2.0;
            this.opts.bondLengthSq = this.opts.bondLength * this.opts.bondLength;
            this.opts.halfFontSizeLarge = this.opts.fontSizeLarge / 2.0;
            this.opts.quarterFontSizeLarge = this.opts.fontSizeLarge / 4.0;
            this.opts.fifthFontSizeSmall = this.opts.fontSizeSmall / 5.0;

            // Set the default theme.
            this.theme = this.opts.themes.dark;
    }
}

export = OptionsManager;
