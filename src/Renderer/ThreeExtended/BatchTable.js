export default {
    parse(buffer, textDecoder) {
        // textDecoder transforms binary to string
        const content = textDecoder.decode(new Uint8Array(buffer));
        const json = JSON.parse(content);
        return json;
    },
};
