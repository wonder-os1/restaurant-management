import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('[seed] Starting seed...')

  // ---- Users ----
  const adminPassword = await bcrypt.hash('Admin@123456', 12)
  const managerPassword = await bcrypt.hash('Manager@123456', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@restaurant.com' },
    update: {},
    create: {
      email: 'admin@restaurant.com',
      password: adminPassword,
      name: 'Restaurant Admin',
      phone: '9876543210',
      role: 'ADMIN',
    },
  })
  console.log('[seed] Admin user created:', admin.email)

  const manager = await prisma.user.upsert({
    where: { email: 'manager@restaurant.com' },
    update: {},
    create: {
      email: 'manager@restaurant.com',
      password: managerPassword,
      name: 'Floor Manager',
      phone: '9876543211',
      role: 'MANAGER',
    },
  })
  console.log('[seed] Manager user created:', manager.email)

  // ---- Menu Categories ----
  const categories = [
    { name: 'Starters', slug: 'starters', description: 'Appetizers and starters', sortOrder: 1 },
    { name: 'Main Course', slug: 'main-course', description: 'Main course dishes', sortOrder: 2 },
    { name: 'Breads', slug: 'breads', description: 'Indian breads and rotis', sortOrder: 3 },
    { name: 'Beverages', slug: 'beverages', description: 'Drinks and beverages', sortOrder: 4 },
    { name: 'Desserts', slug: 'desserts', description: 'Sweets and desserts', sortOrder: 5 },
  ]

  const createdCategories: Record<string, string> = {}
  for (const cat of categories) {
    const created = await prisma.menuCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
    createdCategories[cat.slug] = created.id
  }
  console.log('[seed] Menu categories created')

  // ---- Menu Items ----
  const menuItems = [
    // Starters
    { name: 'Paneer Tikka', description: 'Marinated cottage cheese grilled in tandoor', price: 28000, categorySlug: 'starters', isVeg: true, sortOrder: 1 },
    { name: 'Chicken Tikka', description: 'Boneless chicken marinated in spices and grilled', price: 32000, categorySlug: 'starters', isVeg: false, sortOrder: 2 },
    { name: 'Veg Spring Rolls', description: 'Crispy rolls stuffed with mixed vegetables', price: 22000, categorySlug: 'starters', isVeg: true, sortOrder: 3 },
    { name: 'Fish Amritsari', description: 'Crispy fried fish with punjabi spices', price: 35000, categorySlug: 'starters', isVeg: false, sortOrder: 4 },
    // Main Course
    { name: 'Butter Chicken', description: 'Tender chicken in creamy tomato gravy', price: 38000, categorySlug: 'main-course', isVeg: false, sortOrder: 1 },
    { name: 'Dal Makhani', description: 'Slow-cooked black lentils in rich butter gravy', price: 26000, categorySlug: 'main-course', isVeg: true, sortOrder: 2 },
    { name: 'Palak Paneer', description: 'Cottage cheese cubes in creamy spinach gravy', price: 28000, categorySlug: 'main-course', isVeg: true, sortOrder: 3 },
    { name: 'Mutton Rogan Josh', description: 'Kashmiri style slow-cooked mutton curry', price: 42000, categorySlug: 'main-course', isVeg: false, sortOrder: 4 },
    { name: 'Chole Bhature', description: 'Spiced chickpea curry with fried bread', price: 22000, categorySlug: 'main-course', isVeg: true, sortOrder: 5 },
    { name: 'Biryani (Veg)', description: 'Fragrant basmati rice with mixed vegetables', price: 28000, categorySlug: 'main-course', isVeg: true, sortOrder: 6 },
    { name: 'Chicken Biryani', description: 'Fragrant basmati rice with tender chicken pieces', price: 34000, categorySlug: 'main-course', isVeg: false, sortOrder: 7 },
    // Breads
    { name: 'Butter Naan', description: 'Soft tandoor-baked bread with butter', price: 6000, categorySlug: 'breads', isVeg: true, sortOrder: 1 },
    { name: 'Garlic Naan', description: 'Tandoor-baked bread with garlic and coriander', price: 7000, categorySlug: 'breads', isVeg: true, sortOrder: 2 },
    { name: 'Tandoori Roti', description: 'Whole wheat bread baked in tandoor', price: 4000, categorySlug: 'breads', isVeg: true, sortOrder: 3 },
    { name: 'Laccha Paratha', description: 'Layered flaky whole wheat bread', price: 6000, categorySlug: 'breads', isVeg: true, sortOrder: 4 },
    // Beverages
    { name: 'Masala Chai', description: 'Traditional Indian spiced tea', price: 5000, categorySlug: 'beverages', isVeg: true, sortOrder: 1 },
    { name: 'Mango Lassi', description: 'Refreshing yogurt drink with mango pulp', price: 12000, categorySlug: 'beverages', isVeg: true, sortOrder: 2 },
    { name: 'Fresh Lime Soda', description: 'Freshly squeezed lime with soda water', price: 8000, categorySlug: 'beverages', isVeg: true, sortOrder: 3 },
    // Desserts
    { name: 'Gulab Jamun', description: 'Deep-fried milk dumplings in sugar syrup', price: 12000, categorySlug: 'desserts', isVeg: true, sortOrder: 1 },
    { name: 'Rasmalai', description: 'Soft paneer discs soaked in sweetened milk', price: 14000, categorySlug: 'desserts', isVeg: true, sortOrder: 2 },
  ]

  for (const item of menuItems) {
    const { categorySlug, ...data } = item
    await prisma.menuItem.create({
      data: {
        ...data,
        categoryId: createdCategories[categorySlug],
      },
    })
  }
  console.log(`[seed] ${menuItems.length} menu items created`)

  // ---- Tables ----
  const tables = [
    { number: 1, capacity: 2, section: 'Indoor' },
    { number: 2, capacity: 2, section: 'Indoor' },
    { number: 3, capacity: 4, section: 'Indoor' },
    { number: 4, capacity: 4, section: 'Indoor' },
    { number: 5, capacity: 6, section: 'Indoor' },
    { number: 6, capacity: 6, section: 'Indoor' },
    { number: 7, capacity: 8, section: 'Private' },
    { number: 8, capacity: 4, section: 'Outdoor' },
    { number: 9, capacity: 4, section: 'Outdoor' },
    { number: 10, capacity: 10, section: 'Private' },
  ]

  for (const table of tables) {
    await prisma.table.upsert({
      where: { number: table.number },
      update: {},
      create: table,
    })
  }
  console.log(`[seed] ${tables.length} tables created`)

  // ---- Settings ----
  const settings = [
    { key: 'restaurantName', value: 'Spice Garden Restaurant', type: 'string' },
    { key: 'address', value: '123, MG Road, Bengaluru, Karnataka 560001', type: 'string' },
    { key: 'phone', value: '+91 80 1234 5678', type: 'string' },
    { key: 'email', value: 'info@spicegarden.com', type: 'string' },
    { key: 'gstNumber', value: '29AABCU9603R1ZM', type: 'string' },
    { key: 'gstRate', value: '5', type: 'number' },
    { key: 'serviceChargeRate', value: '10', type: 'number' },
    { key: 'currency', value: 'INR', type: 'string' },
    { key: 'timezone', value: 'Asia/Kolkata', type: 'string' },
    { key: 'businessHoursStart', value: '10:00', type: 'string' },
    { key: 'businessHoursEnd', value: '23:00', type: 'string' },
    { key: 'deliveryRadius', value: '10', type: 'number' },
    { key: 'minOrderAmount', value: '20000', type: 'number' },
    { key: 'avgPrepTime', value: '30', type: 'number' },
  ]

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: { key: setting.key, value: setting.value, type: setting.type },
    })
  }
  console.log(`[seed] ${settings.length} settings created`)

  console.log('[seed] Done!')
}

main()
  .catch((e) => {
    console.error('[seed] Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
