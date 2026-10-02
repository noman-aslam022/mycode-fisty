export interface Category {
  id: string;
  name: string;
  count: number;
  blurb: string;
  image: string;
}

export const categories: Category[] = [
  {
    id: "c-new",
    name: "New Arrivals",
    count: 148,
    blurb: "Fresh drops, every single week",
    image:
      "https://readdy.ai/api/search-image?query=Stylish%20model%20in%20acid%20green%20streetwear%20outfit%20posed%20against%20a%20warm%20cream%20studio%20wall%2C%20bold%20editorial%20fashion%20photography%2C%20soft%20window%20light%2C%20warm%20neutral%20tones%2C%20high%20detail&width=900&height=1100&seq=fitsy-cat-new-01&orientation=portrait",
  },
  {
    id: "c-street",
    name: "Streetwear",
    count: 92,
    blurb: "Baggy, loud and unapologetic",
    image:
      "https://readdy.ai/api/search-image?query=Urban%20streetwear%20look%20with%20oversized%20hoodie%20and%20cargo%20pants%20on%20a%20cream%20studio%20background%2C%20editorial%20fashion%20photography%2C%20soft%20directional%20lighting%2C%20warm%20neutral%20tones%2C%20high%20detail&width=900&height=1100&seq=fitsy-cat-street-02&orientation=portrait",
  },
  {
    id: "c-outer",
    name: "Outerwear",
    count: 64,
    blurb: "Layers that carry the whole fit",
    image:
      "https://readdy.ai/api/search-image?query=Model%20wearing%20an%20oversized%20oatmeal%20wool%20coat%20on%20a%20minimal%20cream%20studio%20background%2C%20luxury%20editorial%20fashion%20photography%2C%20soft%20even%20lighting%2C%20warm%20neutral%20palette%2C%20high%20detail&width=900&height=1100&seq=fitsy-cat-outer-03&orientation=portrait",
  },
  {
    id: "c-access",
    name: "Accessories",
    count: 210,
    blurb: "The details that make it",
    image:
      "https://readdy.ai/api/search-image?query=Flat%20lay%20of%20fashion%20accessories%20including%20chrome%20sunglasses%20and%20olive%20crossbody%20bag%20on%20a%20cream%20studio%20surface%2C%20editorial%20product%20photography%2C%20soft%20studio%20lighting%2C%20warm%20earthy%20palette%2C%20high%20detail&width=900&height=1100&seq=fitsy-cat-access-04&orientation=portrait",
  },
];