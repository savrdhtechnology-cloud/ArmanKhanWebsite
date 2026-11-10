const source = require('../frontend/tailwind.config.js');
module.exports={...source,content:['../frontend/src/**/*.{js,jsx,ts,tsx}','./app/**/*.{js,jsx,ts,tsx}','./components/**/*.{js,jsx,ts,tsx}']};
