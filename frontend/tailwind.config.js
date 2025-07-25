const config = {
    content: [
        "./src/**/*.{html,js,svelte,ts}",
        "./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}",
    ],

    plugins: [
        require('flowbite/plugin')
    ],

    darkMode: 'class',
    safelist: [
        'tag-status', 'tag-green', 'tag-red',
        'bg-green-100', 'text-green-800', 'border-green-400',
        'bg-red-100', 'text-red-800', 'border-red-400'
    ],

    theme: {
        extend: {
            colors: {
                // flowbite-svelte
                primary: { 50: '#FFF5F2', 100: '#FFF1EE', 200: '#FFE4DE', 300: '#FFD5CC', 400: '#FFBCAD', 500: '#FE795D', 600: '#EF562F', 700: '#EB4F27', 800: '#CC4522', 900: '#A5371B' },
            }
        }
    }
};

module.exports = config;