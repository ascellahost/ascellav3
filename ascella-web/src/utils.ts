export const getConfig = () => {
    const def = {
        days: 30,
        style: 1,
        domain: "is-a-huge.monster",
        embed: {},
    };
    try {
        return JSON.parse(localStorage.getItem("config") ?? "null") || def
    } catch (e) {
        return def
    }
}