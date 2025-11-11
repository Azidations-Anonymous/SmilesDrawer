import { IMoleculeOptions, IUserOptions, IThemeColors } from './IOptions';
import { normalizeUserOptions, materializeLegacyOptions } from './OptionsNormalizer';

class OptionsManager {
    userOpts: IUserOptions;
    opts: IMoleculeOptions;
    theme: IThemeColors;

    constructor(userOptions: Partial<IMoleculeOptions> | Partial<IUserOptions> = {}) {
        this.userOpts = normalizeUserOptions(userOptions);
        this.opts = materializeLegacyOptions(this.userOpts);

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
