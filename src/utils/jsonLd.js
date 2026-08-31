
export const serializeJsonLd = (schema) => {
    if (!schema) return '';
    return JSON.stringify(schema).replace(/</g, '\\u003c');
};

export default serializeJsonLd;
