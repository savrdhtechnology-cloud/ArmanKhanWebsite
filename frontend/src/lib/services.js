// Central service catalog (no prices per owner's request)
export const GENTS_SERVICES = [
  { name: "Signature Haircut", desc: "Precision cut & styling tailored to your look.", img: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { name: "Haircut & Beard Styling", desc: "Complete grooming with haircut and beard shape.", img: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { name: "Beard Design", desc: "Sharp lines & artistic beard grooming.", img: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { name: "Hair Colour", desc: "Premium global shades for a striking look.", img: "https://images.unsplash.com/photo-1626383137804-ee0129ec53d4?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { name: "Hair Spa", desc: "Nourishing spa for healthy scalp & hair.", img: "https://images.unsplash.com/photo-1560869713-7d0a29430803?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { name: "De-Tan Facial", desc: "Deep cleansing for glowing, fresh skin.", img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { name: "Head Massage", desc: "Relaxing oil therapy for stress relief.", img: "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { name: "Kids Haircut", desc: "Neat & stylish cuts for our little champs.", img: "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
];

export const LADIES_SERVICES = [
  { name: "Hair Cut", desc: "Trendy cuts for all hair lengths.", img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { name: "Hair Styling", desc: "Blowdry, curls, waves & advanced styling.", img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { name: "Hair Colour", desc: "Global colour shades for a perfect look.", img: "https://images.unsplash.com/photo-1595475884562-073c30d45670?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { name: "Bridal Hair Styling", desc: "Complete bridal look for your big day.", img: "https://images.unsplash.com/photo-1519741497674-611481863552?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { name: "Keratin Treatment", desc: "Smooth, shiny & frizz-free hair.", img: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { name: "Hair Smoothening", desc: "Silky smooth hair that lasts months.", img: "https://images.unsplash.com/photo-1554519515-242161756769?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { name: "Hair Spa", desc: "Nourishing treatment for healthy hair.", img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
  { name: "Hair Treatments", desc: "Advanced treatments for hair health.", img: "https://images.unsplash.com/photo-1470259078422-826894b933aa?crop=entropy&cs=srgb&fm=jpg&q=85&w=800" },
];

export const ALL_SERVICE_NAMES = [
  ...GENTS_SERVICES.map((s) => `Gents - ${s.name}`),
  ...LADIES_SERVICES.map((s) => `Ladies - ${s.name}`),
];

export const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1595475884562-073c30d45670?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1621605815971-fbc98d665033?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1560869713-7d0a29430803?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1519741497674-611481863552?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1626383137804-ee0129ec53d4?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
  "https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?crop=entropy&cs=srgb&fm=jpg&q=85&w=900",
];
