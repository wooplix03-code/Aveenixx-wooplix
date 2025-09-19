import { db } from "../db.js";
import { categories, platformCategoryMappings, categoryClassificationRules } from "../../shared/schema.js";
import { categoryService } from "./categoryService.js";

/**
 * Hybrid Category Mapping Service
 * Creates intelligent mappings between external platform categories and Aveenix categories
 * Based on analysis of Amazon, AliExpress, and WooCommerce category structures
 */

interface CategoryMappingRule {
  keywords: string[];
  categoryName: string;
  confidence: number;
  platforms: string[];
}

interface EnhancedClassificationResult {
  primaryCategory: {
    id: number;
    name: string;
    confidence: number;
  };
  alternativeCategories: Array<{
    id: number;
    name: string;
    confidence: number;
  }>;
  matchingRules: string[];
  processingTime: number;
  requiresReview: boolean;
}

export class HybridCategoryMappingService {
  // Hybrid category mapping rules based on major e-commerce platforms
  private hybridMappingRules: CategoryMappingRule[] = [
    // Electronics & Technology
    {
      keywords: ['smartphone', 'mobile phone', 'cell phone', 'iphone', 'android', 'galaxy'],
      categoryName: 'Smartphones',
      confidence: 95,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    },
    {
      keywords: ['laptop', 'notebook', 'macbook', 'chromebook', 'gaming laptop'],
      categoryName: 'Laptops & Computers',
      confidence: 90,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    },
    {
      keywords: ['headphone', 'earphone', 'earbud', 'airpod', 'headset', 'audio'],
      categoryName: 'Headphones & Audio',
      confidence: 88,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    },
    {
      keywords: ['tablet', 'ipad', 'surface', 'kindle', 'e-reader'],
      categoryName: 'Electronics & Technology',
      confidence: 85,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    },

    // Fashion & Apparel
    {
      keywords: ['dress', 'shirt', 'blouse', 'top', 'women clothing', 'ladies wear'],
      categoryName: 'Fashion & Apparel',
      confidence: 90,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    },
    {
      keywords: ['men shirt', 'polo', 't-shirt', 'hoodie', 'men clothing', 'mens wear'],
      categoryName: 'Fashion & Apparel',
      confidence: 90,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    },
    {
      keywords: ['shoes', 'sneaker', 'boot', 'sandal', 'heel', 'footwear'],
      categoryName: 'Fashion & Apparel',
      confidence: 92,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    },

    // Home & Garden
    {
      keywords: ['kitchen', 'cookware', 'utensil', 'appliance', 'home decor', 'home decorations', 'wall art', 'poster', 'canvas', 'frame', 'mirror', 'lamp', 'lighting', 'curtain', 'blinds', 'rug', 'carpet', 'pillow', 'cushion', 'vase', 'candle'],
      categoryName: 'Home & Garden',
      confidence: 85,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    },
    {
      keywords: ['furniture', 'chair', 'table', 'sofa', 'bed', 'desk', 'bookcase', 'bookshelf', 'storage', 'organizer', 'cabinet', 'dresser', 'wardrobe', 'shelf', 'shelving', 'cube storage'],
      categoryName: 'Home & Garden',
      confidence: 95,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    },

    // Health & Beauty
    {
      keywords: ['skincare', 'makeup', 'cosmetic', 'beauty', 'facial', 'serum'],
      categoryName: 'Health & Beauty',
      confidence: 90,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    },
    {
      keywords: ['supplement', 'vitamin', 'health', 'fitness', 'protein', 'wellness'],
      categoryName: 'Health & Beauty',
      confidence: 87,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    },

    // Sports & Outdoors
    {
      keywords: ['sport', 'fitness', 'gym', 'exercise', 'outdoor', 'camping'],
      categoryName: 'Sports & Outdoors',
      confidence: 85,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    },

    // Automotive
    {
      keywords: ['car', 'automotive', 'vehicle', 'motor', 'auto part', 'accessory'],
      categoryName: 'Automotive',
      confidence: 88,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    },

    // Books & Media
    {
      keywords: ['novel', 'textbook', 'ebook', 'magazine', 'reading', 'paperback', 'hardcover', 'audiobook'],
      categoryName: 'Books & Media',
      confidence: 92,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    },

    // Toys & Games
    {
      keywords: ['toy', 'game', 'puzzle', 'doll', 'action figure', 'children', 'kids'],
      categoryName: 'Toys & Games',
      confidence: 90,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    },

    // Pet Supplies - More specific keywords to prevent false matches
    {
      keywords: ['pet food', 'dog food', 'cat food', 'pet toy', 'dog toy', 'cat toy', 'pet collar', 'dog collar', 'cat collar', 'pet leash', 'dog leash', 'pet bed', 'dog bed', 'cat bed', 'pet grooming', 'dog grooming', 'cat grooming', 'aquarium', 'fish tank', 'bird cage', 'hamster cage', 'pet carrier', 'dog carrier', 'cat carrier'],
      categoryName: 'Pet Supplies',
      confidence: 95,
      platforms: ['amazon', 'aliexpress', 'woocommerce']
    }
  ];

  // Enhanced product classification with multiple category suggestions
  async classifyProductAdvanced(
    productName: string, 
    description?: string, 
    wooCommerceCategories?: string[],
    brand?: string,
    price?: number,
    tags?: string[]
  ): Promise<EnhancedClassificationResult> {
    const startTime = Date.now();
    const searchText = `${productName} ${description || ''} ${brand || ''} ${tags?.join(' ') || ''}`.toLowerCase();
    
    const categoryScores = new Map<string, { score: number, reasons: string[] }>();

    // 1. WooCommerce Category Direct Mapping (Reduced Priority - will be validated against AI analysis)
    const wooCommerceMappings = new Map<string, { score: number, reasons: string[] }>();
    if (wooCommerceCategories && wooCommerceCategories.length > 0) {
      for (const wooCategory of wooCommerceCategories) {
        const mappedCategory = await categoryService.findMasterCategoryFromPlatform(
          'woocommerce',
          wooCategory,
          wooCategory
        );
        
        if (mappedCategory) {
          const current = wooCommerceMappings.get(mappedCategory.name) || { score: 0, reasons: [] };
          current.score += 25; // Reduced weight for direct mapping - will be validated
          current.reasons.push(`WooCommerce category: ${wooCategory}`);
          wooCommerceMappings.set(mappedCategory.name, current);
        }
      }
    }

    // 2. Hybrid Keyword Analysis
    for (const rule of this.hybridMappingRules) {
      let matchScore = 0;
      const matchedKeywords: string[] = [];

      for (const keyword of rule.keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          matchScore += 1;
          matchedKeywords.push(keyword);
        }
      }

      if (matchScore > 0) {
        const confidence = Math.min((matchScore / rule.keywords.length) * rule.confidence, 100);
        const current = categoryScores.get(rule.categoryName) || { score: 0, reasons: [] };
        current.score += confidence;
        current.reasons.push(`Keyword match: ${matchedKeywords.join(', ')} (${confidence.toFixed(0)}% confidence)`);
        categoryScores.set(rule.categoryName, current);
      }
    }

    // 3. Existing Classification Rules
    const existingClassification = await categoryService.classifyProduct(productName, description, brand, price);
    if (existingClassification.confidence > 0) {
      const current = categoryScores.get(existingClassification.categoryName) || { score: 0, reasons: [] };
      current.score += existingClassification.confidence;
      current.reasons.push(`Existing rule: ${existingClassification.reason}`);
      categoryScores.set(existingClassification.categoryName, current);
    }

    // 4. Brand-based Classification
    if (brand) {
      const brandMappings = await this.getBrandCategoryMappings(brand.toLowerCase());
      for (const mapping of brandMappings) {
        const current = categoryScores.get(mapping.categoryName) || { score: 0, reasons: [] };
        current.score += mapping.confidence;
        current.reasons.push(`Brand association: ${brand} → ${mapping.categoryName}`);
        categoryScores.set(mapping.categoryName, current);
      }
    }

    // 5. Price Range Analysis
    if (price && price > 0) {
      const priceCategory = await this.getPriceCategoryMapping(price);
      if (priceCategory) {
        const current = categoryScores.get(priceCategory.categoryName) || { score: 0, reasons: [] };
        current.score += priceCategory.confidence;
        current.reasons.push(`Price range indicator: $${price} → ${priceCategory.categoryName}`);
        categoryScores.set(priceCategory.categoryName, current);
      }
    }

    // Smart validation: Check if AI suggestions strongly disagree with WooCommerce mappings
    const aiTopCategories = Array.from(categoryScores.entries())
      .map(([categoryName, data]) => ({ categoryName, score: data.score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3); // Top 3 AI suggestions

    // Add WooCommerce mappings with validation
    for (const [categoryName, wooData] of wooCommerceMappings.entries()) {
      const current = categoryScores.get(categoryName) || { score: 0, reasons: [] };
      const topAiScore = aiTopCategories[0]?.score || 0;
      const isWooCommerceCategory = wooCommerceMappings.has(categoryName);
      const aiSuggestionForSameCategory = current.score;
      
      // If AI strongly suggests a different category (50+ points difference), reduce WooCommerce weight
      if (topAiScore > 50 && aiSuggestionForSameCategory < 20 && topAiScore - aiSuggestionForSameCategory > 50) {
        // WooCommerce suggestion conflicts with strong AI analysis - reduce weight significantly
        current.score += Math.max(wooData.score * 0.3, 10); // Reduce to 30% weight
        current.reasons.push(`${wooData.reasons[0]} (reduced confidence due to AI analysis conflict)`);
      } else {
        // Normal case - add the WooCommerce weight
        current.score += wooData.score;
        current.reasons.push(...wooData.reasons);
      }
      
      categoryScores.set(categoryName, current);
    }

    // Convert scores to results
    const sortedResults = Array.from(categoryScores.entries())
      .map(([categoryName, data]) => ({
        categoryName,
        confidence: Math.min(data.score, 100),
        reasons: data.reasons
      }))
      .sort((a, b) => b.confidence - a.confidence);

    let primaryCategory;
    let alternativeCategories = [];

    if (sortedResults.length > 0) {
      // Get category IDs
      const allCategories = await categoryService.getAllCategories();
      const categoryMap = new Map(allCategories.map(cat => [cat.name, cat.id]));

      const primary = sortedResults[0];
      const primaryId = categoryMap.get(primary.categoryName);

      if (primaryId) {
        primaryCategory = {
          id: primaryId,
          name: primary.categoryName,
          confidence: primary.confidence
        };

        alternativeCategories = sortedResults.slice(1, 4).map(result => {
          const id = categoryMap.get(result.categoryName);
          return id ? {
            id,
            name: result.categoryName,
            confidence: result.confidence
          } : null;
        }).filter(Boolean);
      }
    }

    // Fallback to Uncategorized
    if (!primaryCategory) {
      const uncategorized = await categoryService.getAllCategories().then(cats => 
        cats.find(cat => cat.slug === 'uncategorized')
      );
      
      if (uncategorized) {
        primaryCategory = {
          id: uncategorized.id,
          name: uncategorized.name,
          confidence: 0
        };
      }
    }

    const processingTime = Date.now() - startTime;
    const requiresReview = primaryCategory.confidence < 70; // Flag for manual review if confidence is low

    return {
      primaryCategory,
      alternativeCategories,
      matchingRules: sortedResults.flatMap(r => r.reasons),
      processingTime,
      requiresReview
    };
  }

  // Initialize hybrid category mappings in database
  async initializeHybridMappings(): Promise<void> {
    console.log('🔄 Initializing hybrid category mappings...');
    
    let createdMappings = 0;
    const allCategories = await categoryService.getAllCategories();
    const categoryMap = new Map(allCategories.map(cat => [cat.name, cat.id]));

    for (const rule of this.hybridMappingRules) {
      const categoryId = categoryMap.get(rule.categoryName);
      
      if (categoryId) {
        // Create classification rules for each keyword
        for (const keyword of rule.keywords) {
          try {
            await categoryService.createClassificationRule(
              `Hybrid: ${keyword} → ${rule.categoryName}`,
              'keyword',
              keyword,
              categoryId,
              80, // High priority for hybrid rules
              rule.confidence
            );
            createdMappings++;
          } catch (error) {
            // Rule might already exist, skip
            console.log(`⚠️ Skipping existing rule: ${keyword}`);
          }
        }

        // Create platform mappings for major e-commerce sites
        for (const platform of rule.platforms) {
          for (const keyword of rule.keywords.slice(0, 3)) { // Top 3 keywords per platform
            try {
              await categoryService.createPlatformMapping(
                categoryId,
                platform,
                `hybrid_${keyword.replace(/\s+/g, '_')}`,
                keyword,
                undefined,
                rule.confidence,
                true // Auto-generated
              );
            } catch (error) {
              // Mapping might already exist, skip
            }
          }
        }
      }
    }

    console.log(`✅ Created ${createdMappings} hybrid classification rules`);
  }

  // Get brand-based category mappings
  private async getBrandCategoryMappings(brand: string): Promise<Array<{ categoryName: string, confidence: number }>> {
    const brandMappings = [
      // Electronics brands
      { brands: ['apple', 'samsung', 'google', 'xiaomi', 'huawei'], category: 'Smartphones', confidence: 25 },
      { brands: ['dell', 'hp', 'lenovo', 'asus', 'acer'], category: 'Laptops & Computers', confidence: 25 },
      { brands: ['sony', 'bose', 'beats', 'sennheiser', 'audio-technica'], category: 'Headphones & Audio', confidence: 30 },
      
      // Fashion brands
      { brands: ['nike', 'adidas', 'puma', 'under armour'], category: 'Fashion & Apparel', confidence: 25 },
      { brands: ['zara', 'h&m', 'uniqlo', 'gap'], category: 'Fashion & Apparel', confidence: 20 },
      
      // Beauty brands
      { brands: ['loreal', 'maybelline', 'revlon', 'clinique'], category: 'Health & Beauty', confidence: 30 },
    ];

    return brandMappings
      .filter(mapping => mapping.brands.some(b => brand.includes(b)))
      .map(mapping => ({ categoryName: mapping.category, confidence: mapping.confidence }));
  }

  // Get price-based category suggestions
  private async getPriceCategoryMapping(price: number): Promise<{ categoryName: string, confidence: number } | null> {
    // Price range indicators based on typical product categories
    if (price >= 500) {
      return { categoryName: 'Electronics & Technology', confidence: 15 };
    } else if (price >= 100) {
      return { categoryName: 'Fashion & Apparel', confidence: 10 };
    } else if (price >= 20) {
      return { categoryName: 'Home & Garden', confidence: 8 };
    } else {
      return { categoryName: 'Health & Beauty', confidence: 5 };
    }
  }

  // Get category classification statistics
  async getClassificationStats(): Promise<{
    totalHybridRules: number;
    averageConfidence: number;
    categoriesWithMappings: number;
    recentClassifications: number;
  }> {
    const stats = await categoryService.getClassificationStats();
    
    return {
      totalHybridRules: this.hybridMappingRules.reduce((sum, rule) => sum + rule.keywords.length, 0),
      averageConfidence: stats.averageConfidence,
      categoriesWithMappings: stats.categoriesWithMappings,
      recentClassifications: stats.totalRules
    };
  }
}

export const hybridCategoryMappingService = new HybridCategoryMappingService();