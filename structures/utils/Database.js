const {
    Sequelize: sequelize,
    Users,
    UserItems,
    UserOres,
    Items,
    OreStore,
    Guilds,
    Craftable,
    ShopItems,
    Ores
} = require("../../database");

UserItems.belongsTo(Items, { foreignKey: "item_id", as: "item" });
UserOres.belongsTo(OreStore, { foreignKey: "ore_id", as: "ore" });

module.exports =
    class {

        _addToItems(type, item) {
            item.type = type;
            return Items.upsert(item);
        }

        async _loadItems() {
            const TableUpserts = [
                ...ShopItems.map(item => this._addToItems("shop", item)),
                ...Craftable.map(craft => this._addToItems("craft", craft)),
                ...Ores.map(ore => OreStore.upsert(ore))
            ];

            await Promise.all(TableUpserts);
        }

        async init() {
            await sequelize.authenticate();
            await sequelize.sync();
            await this._loadItems();
            await Users.load();
            await Guilds.load();
        }
    };