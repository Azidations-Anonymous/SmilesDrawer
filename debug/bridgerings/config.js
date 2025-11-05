const { createMoleculeOptions } = require('../molecule-options');

const SMILES = 'CC1=[O][Fe]2345ON1CCC[C@H]1NC(=O)CNC(=O)[C@H](CO)NC(=O)CNC(=O)[C@@H](CCCN(O2)C(C)=[O]3)NC(=O)[C@@H](CCCN(O4)C(C)=[O]5)NC1=O';

const MOLECULE_OPTIONS = createMoleculeOptions({
    width: 800,
    height: 800,
    padding: 2.0,
    kkThreshold: 0.1,
    kkInnerThreshold: 0.1,
    kkMaxIteration: 20000,
    kkMaxInnerIteration: 50,
    kkMaxEnergy: 1e9,
});

module.exports = {
    SMILES,
    MOLECULE_OPTIONS,
};
