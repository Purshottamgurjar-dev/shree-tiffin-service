import Meal from '../models/Meal.js';

export const initialMeals = [
  {
    name: 'Special Punjabi Paneer Thali',
    description:
      'Rich paneer butter masala cooked in rich tomato cashew gravy, aromatic yellow dal tadka, 4 butter phulkas, fragrant jeera rice, fresh cucumber mint raita, salad, and soft gulab jamun.',
    price: 180,
    category: 'Special Thali',
    image: '/src/assets/hero-thali.jpg',
    ingredients: ['Paneer', 'Cashew Cream', 'Toor Dal', 'Whole Wheat', 'Basmati Rice', 'Desi Ghee'],
    isAvailable: true,
    isFeatured: true,
    rating: 4.9,
    totalOrders: 142,
  },
  {
    name: 'Ghar Ki Deluxe Lunch Thali',
    description:
      'Authentic homestyle lunch featuring 2 seasonal vegetable sabzis, slow-cooked home dal fry, 4 phulkas smeared with desi ghee, steamed basmati rice, roasted papad, and fresh mango pickle.',
    price: 140,
    category: 'Lunch',
    image: '/src/assets/hero-thali.jpg',
    ingredients: ['Aloo Gobi', 'Bhindi Masala', 'Moong Dal', 'Wheat Phulkas', 'Basmati Rice'],
    isAvailable: true,
    isFeatured: true,
    rating: 4.8,
    totalOrders: 218,
  },
  {
    name: 'Daily Homestyle Lunch Tiffin',
    description:
      'Light, nutritious everyday tiffin box with jeera aloo, homestyle yellow dal, 4 soft whole wheat phulkas, and fresh salad. Ideal for daily office lunch.',
    price: 110,
    category: 'Daily Tiffin',
    image: '/src/assets/hero-thali.jpg',
    ingredients: ['Jeera Aloo', 'Yellow Dal', 'Whole Wheat', 'Salad'],
    isAvailable: true,
    isFeatured: false,
    rating: 4.7,
    totalOrders: 350,
  },
  {
    name: 'Healthy Multigrain Dinner Box',
    description:
      'Nutritious evening meal featuring tender palak paneer, 3 multigrain rotis (jowar, bajra & wheat), steamed brown rice, and fresh cucumber mint raita.',
    price: 130,
    category: 'Dinner',
    image: '/src/assets/hero-thali.jpg',
    ingredients: ['Spinach', 'Fresh Paneer', 'Multigrain Flour', 'Brown Rice', 'Curd'],
    isAvailable: true,
    isFeatured: true,
    rating: 4.8,
    totalOrders: 98,
  },
  {
    name: 'Shahi Royal Feast Thali',
    description:
      'Royal culinary experience with rich Shahi Paneer, creamy Dal Makhani, 2 butter garlic naans, aromatic vegetable pulao, roasted papad, boondi raita, and hot rasgulla.',
    price: 220,
    category: 'Special Thali',
    image: '/src/assets/hero-thali.jpg',
    ingredients: ['Shahi Paneer', 'Urad Dal', 'Butter Naan', 'Saffron Rice', 'Dry Fruits'],
    isAvailable: true,
    isFeatured: false,
    rating: 5.0,
    totalOrders: 65,
  },
  {
    name: 'Desi Ghee Poha Breakfast',
    description:
      'Indori-style flattened rice cooked with crunchy roasted peanuts, mustard seeds, curry leaves, turmeric, topped with fresh coriander, pomegranate seeds, and crispy sev.',
    price: 60,
    category: 'Breakfast',
    image: '/src/assets/hero-thali.jpg',
    ingredients: ['Thick Poha', 'Peanuts', 'Curry Leaves', 'Desi Ghee', 'Lemon', 'Sev'],
    isAvailable: true,
    isFeatured: false,
    rating: 4.6,
    totalOrders: 180,
  },
  {
    name: 'Fresh Desi Ghee Phulka Pack (4 Pcs)',
    description:
      'Four freshly puffed, soft whole wheat phulkas prepared fresh on tawa and gently brushed with pure desi cow ghee.',
    price: 30,
    category: 'Add-ons',
    image: '/src/assets/hero-thali.jpg',
    ingredients: ['Sharbati Wheat Flour', 'Pure Desi Cow Ghee'],
    isAvailable: true,
    isFeatured: false,
    rating: 4.9,
    totalOrders: 420,
  },
  {
    name: 'Chilled Spiced Masala Chaas',
    description:
      'Traditional spiced buttermilk churned with roasted cumin powder, black salt, fresh mint leaves, and ginger. Perfect digestive drink with any meal.',
    price: 25,
    category: 'Extra Items',
    image: '/src/assets/hero-thali.jpg',
    ingredients: ['Fresh Curd', 'Roasted Cumin', 'Mint', 'Black Salt', 'Ginger'],
    isAvailable: true,
    isFeatured: false,
    rating: 4.8,
    totalOrders: 290,
  },
];

export const seedMeals = async () => {
  try {
    const count = await Meal.countDocuments({});
    if (count > 0) {
      console.log(`[Seed] Meals already seeded (${count} meals present).`);
      return;
    }

    console.log('[Seed] Seeding initial Indian homestyle meals...');
    for (const meal of initialMeals) {
      await Meal.create(meal);
    }
    console.log(`[Seed] Successfully seeded ${initialMeals.length} homestyle meals.`);
  } catch (error) {
    console.error(`[Seed Error] Failed to seed meals: ${error.message}`);
  }
};
