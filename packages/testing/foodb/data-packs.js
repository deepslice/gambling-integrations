export const dataPacks = {
  sushi: {
    names: ['California', 'Philadelphia', 'Unagi', 'Sake', 'Tori'],
    ingredients: ['rice', 'nori', 'salmon', 'avocado', 'cucumber'],
    templates: [
      '[names] with [ingredients]',
      'Sushi [ingredients]',
      '[names] in [cities] style',
    ],
    cities: ['Tokyo', 'Osaka', 'Kyoto'],
  },
  burgers: {
    names: ['Cheeseburger', 'Vegan Burger', 'Cherry Burger', 'Double Bacon'],
    toppings: ['cheese', 'ketchup', 'onion', 'lettuce', 'pepper'],
    templates: [
      '[names] with [toppings]',
      'Spicy [burger]',
      '[names] homemade style',
    ],
  },
  pizza: {
    names: ['Margherita', 'Pepperoni', 'Hawaiian', 'Four Cheese'],
    toppings: ['tomatoes', 'mozzarella', 'ham', 'pineapples'],
    templates: [
      'Pizza \'[names]\'',
      '[names] with [toppings]',
    ],
  },
}
