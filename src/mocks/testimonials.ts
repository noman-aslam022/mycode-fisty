export interface Testimonial {
  id: string;
  name: string;
  handle: string;
  location: string;
  quote: string;
  rating: number;
  avatar: string;
}

export const testimonials: Testimonial[] = [
  {
    id: "t-01",
    name: "Mara Delgado",
    handle: "@mara.wears",
    location: "Lisbon, PT",
    quote:
      "I typed 'birthday gift for my brother who's obsessed with 90s style' and it nailed it in seconds. He literally wears the hoodie every day.",
    rating: 5,
    avatar:
      "https://readdy.ai/api/search-image?query=Portrait%20headshot%20of%20a%20smiling%20young%20woman%20with%20warm%20tone%20lighting%20on%20a%20soft%20cream%20background%2C%20clean%20editorial%20photography%2C%20high%20detail&width=200&height=200&seq=fitsy-avatar-01&orientation=squarish",
  },
  {
    id: "t-02",
    name: "Theo Nkemi",
    handle: "@theo.fits",
    location: "London, UK",
    quote:
      "The try-on is unreal. I uploaded one photo and saw the jacket on me before paying. Returned nothing this season. Nothing.",
    rating: 5,
    avatar:
      "https://readdy.ai/api/search-image?query=Portrait%20headshot%20of%20a%20confident%20young%20man%20on%20a%20soft%20cream%20background%20with%20warm%20lighting%2C%20clean%20editorial%20photography%2C%20high%20detail&width=200&height=200&seq=fitsy-avatar-02&orientation=squarish",
  },
  {
    id: "t-03",
    name: "Aiko Sato",
    handle: "@aiko.layers",
    location: "Osaka, JP",
    quote:
      "Most stylish site I've ever bought from. Feels like scrolling a magazine that happens to sell clothes. The curation is chef's kiss.",
    rating: 5,
    avatar:
      "https://readdy.ai/api/search-image?query=Portrait%20headshot%20of%20a%20stylish%20young%20woman%20with%20short%20dark%20hair%20on%20a%20cream%20background%2C%20clean%20editorial%20photography%2C%20high%20detail&width=200&height=200&seq=fitsy-avatar-03&orientation=squarish",
  },
  {
    id: "t-04",
    name: "Ravi Menon",
    handle: "@ravi.styles",
    location: "Toronto, CA",
    quote:
      "Ordered Friday, wore it Sunday. The packaging alone made me post it. This is my new go-to for gifts I actually feel good about.",
    rating: 4,
    avatar:
      "https://readdy.ai/api/search-image?query=Portrait%20headshot%20of%20a%20friendly%20young%20man%20with%20curly%20hair%20on%20a%20soft%20cream%20background%2C%20warm%20lighting%2C%20clean%20editorial%20photography%2C%20high%20detail&width=200&height=200&seq=fitsy-avatar-04&orientation=squarish",
  },
];