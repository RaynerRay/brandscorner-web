export const deliveryFees = {
    harare: {
      type: "distance",
      cbd: 2,
      ranges: [
        { min: 0, max: 3, price: 3 },
        { min: 3, max: 5, price: 4 },
        { min: 5, max: 7, price: 5 },
        { min: 7, max: 9, price: 6 },
        { min: 9, max: 11, price: 7 },
        { min: 11, max: 16, price: 8 }
      ],
      extraPerKm: 0.6
    },
  
    cities: [
      { name: "Bulawayo", price: 5 },
      { name: "Gweru", price: 5 },
      { name: "Kwekwe", price: 5 },
      { name: "Chegutu", price: 5 },
      { name: "Kadoma", price: 5 },
      { name: "Mutare", price: 5 },
      { name: "Masvingo", price: 5 },
      { name: "Zvishavane", price: 5 }
    ],
  
    specialCities: [
      { name: "Beitbridge", price: 10 }
    ]
  };