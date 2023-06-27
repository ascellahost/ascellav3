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

export const getHeadersFromConfig = (config: any) => {
    const headers = {
        "ascella-autodelete": config.days.toString(),
        "ascella-style": config.style,
        "ascella-token": config.token,
        "ascella-domain": `${config.domain}`,
        ...Object.fromEntries(
            Object.entries(config.embed)
                .filter((x) => x[1] !== "")
                .map((x) => [`ascella-og-${x[0]}`, x[1]?.toString()])
        ),
    };
    //remove empty values
    return Object.fromEntries(Object.entries(headers).filter((x) => x[1] !== "" && x[1] !== null && x[1] !== undefined))
}

export const emptyConfig = Object.freeze({
    Version: "14.0.0",
    Name: "Ascella.host - Images",
    DestinationType: "ImageUploader",
    RequestMethod: "POST",
    RequestURL: "https://api.ascella.host/api/v3/upload",
    Headers: {} as Record<string, string>,
    Body: "MultipartFormData",
    FileFormName: "file",
    URL: "{json:url}",
    DeletionURL: "{json:deletion_url}",
    ErrorMessage: "{json:error}",
});

