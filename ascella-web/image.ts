import type { ExternalImageService, ImageTransform } from "astro";
const service: ExternalImageService = {
    validateOptions(options: ImageTransform, serviceConfig: Record<string, any>) {
        return options;
    },
    getURL(options, serviceConfig) {
        return options.src.toString()
    },
    getHTMLAttributes(options, serviceConfig) {
        const { src, format, quality, ...attributes } = options;
        return {
            ...attributes,
            loading: options.loading ?? 'lazy',
            decoding: options.decoding ?? 'async',
        };
    }
};
export default service;
