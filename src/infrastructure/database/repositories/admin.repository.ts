/**
 * Admin Repository
 * Data access layer for admin operations
 */

import { createServerClient, createServiceRoleClient } from "../supabase-server";
import { AdminUser, PromoCode, SystemGroup, SystemCategory, SystemSubcategory } from "../../../domain/admin/admin.types";
import { logger } from "@/src/infrastructure/utils/logger";

export class AdminRepository {
  /**
   * Check if user is super_admin
   */
  async isSuperAdmin(userId: string): Promise<boolean> {
    const supabase = await createServerClient();
    const { data: userData } = await supabase
      .from("User")
      .select("role")
      .eq("id", userId)
      .single();

    return userData?.role === "super_admin";
  }

  /**
   * Get all users with subscription and household information
   */
  async getAllUsers(): Promise<AdminUser[]> {
    const supabase = createServiceRoleClient();

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from("User")
      .select("id, email, name, createdAt, isBlocked")
      .order("createdAt", { ascending: false });

    if (usersError) {
      logger.error("[AdminRepository] Error fetching users:", usersError);
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    if (!users || users.length === 0) {
      return [];
    }

    const userIds = users.map((u) => u.id);

    // Get all subscriptions
    const { data: subscriptions } = await supabase
      .from("Subscription")
      .select("id, userId, planId, status, trialEndDate, trialStartDate, stripeSubscriptionId, currentPeriodEnd, cancelAtPeriodEnd")
      .in("userId", userIds)
      .order("createdAt", { ascending: false });

    // Get all plans
    const { data: plans } = await supabase
      .from("Plan")
      .select("id, name");

    const planMap = new Map((plans || []).map((p) => [p.id, p]));
    
    // Create subscription map (most recent per user)
    const subscriptionMap = new Map<string, any>();
    (subscriptions || []).forEach((s) => {
      if (!subscriptionMap.has(s.userId)) {
        subscriptionMap.set(s.userId, s);
      }
    });

    // Get household information
    const { data: ownedHouseholds } = await supabase
      .from("Household")
      .select("id, createdBy, type")
      .in("createdBy", userIds);

    const allOwnedHouseholdIds = (ownedHouseholds || []).map(h => h.id);
    
    const { data: householdMembers } = await supabase
      .from("HouseholdMemberNew")
      .select("userId, householdId, status, email, name, Household(createdBy, type)")
      .in("status", ["active", "pending"])
      .or(
        userIds.length > 0 && allOwnedHouseholdIds.length > 0
          ? `userId.in.(${userIds.join(',')}),householdId.in.(${allOwnedHouseholdIds.join(',')})`
          : userIds.length > 0
          ? `userId.in.(${userIds.join(',')})`
          : allOwnedHouseholdIds.length > 0
          ? `householdId.in.(${allOwnedHouseholdIds.join(',')})`
          : "id.eq.null"
      );

    // Build household info map (simplified version)
    const householdInfoMap = new Map<string, { hasHousehold: boolean; isOwner: boolean; memberCount: number; householdId: string | null; ownerId: string | null }>();
    
    userIds.forEach((userId) => {
      const ownedHousehold = (ownedHouseholds || []).find((h) => h.createdBy === userId);
      const isOwner = !!ownedHousehold;
      
      const memberHousehold = (householdMembers || []).find((hm: any) => {
        const household = hm.Household as any;
        return hm.userId === userId && 
               hm.status === "active" && 
               household?.createdBy !== userId;
      });
      const isMember = !!memberHousehold;
      
      let householdId: string | null = null;
      let ownerId: string | null = null;
      
      if (isOwner && ownedHousehold) {
        householdId = ownedHousehold.id;
        ownerId = userId;
      } else if (isMember && memberHousehold) {
        householdId = memberHousehold.householdId;
        const household = memberHousehold.Household as any;
        ownerId = household?.createdBy || null;
      }
      
      householdInfoMap.set(userId, {
        hasHousehold: isOwner || isMember,
        isOwner,
        memberCount: 0, // Simplified - would need to count members
        householdId,
        ownerId,
      });
    });

    // Map users with their data
    return users.map((user) => {
      const subscription = subscriptionMap.get(user.id);
      const plan = subscription ? planMap.get(subscription.planId) : null;
      const household = householdInfoMap.get(user.id) || {
        hasHousehold: false,
        isOwner: false,
        memberCount: 0,
        householdId: null,
        ownerId: null,
      };

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: new Date(user.createdAt),
        isBlocked: user.isBlocked || false,
        plan: plan ? { id: plan.id, name: plan.name } : null,
        subscription: subscription ? {
          id: subscription.id,
          status: subscription.status,
          planId: subscription.planId,
          trialEndDate: subscription.trialEndDate || null,
          trialStartDate: subscription.trialStartDate || null,
          stripeSubscriptionId: subscription.stripeSubscriptionId || null,
          currentPeriodEnd: subscription.currentPeriodEnd || null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        } : null,
        household,
      };
    });
  }

  /**
   * Check if user exists
   */
  async userExists(userId: string): Promise<boolean> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("User")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    return true;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<{ id: string; email: string; isBlocked: boolean } | null> {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("User")
      .select("id, email, isBlocked")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      isBlocked: data.isBlocked || false,
    };
  }

  /**
   * Block or unblock a user
   */
  async blockUser(userId: string, isBlocked: boolean, reason?: string, blockedBy?: string): Promise<void> {
    const supabase = createServiceRoleClient();

    const { error: updateError } = await supabase
      .from("User")
      .update({
        isBlocked,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      logger.error("[AdminRepository] Error blocking user:", updateError);
      throw new Error(`Failed to block user: ${updateError.message}`);
    }

    // Save to block history if blocking or unblocking
    if (reason && blockedBy) {
      await supabase
        .from("UserBlockHistory")
        .insert({
          userId,
          action: isBlocked ? "block" : "unblock",
          reason: reason.trim(),
          blockedBy,
        });
    }
  }

  /**
   * Get all promo codes
   */
  async getAllPromoCodes(): Promise<PromoCode[]> {
    const supabase = await createServerClient();

    const { data: promoCodes, error } = await supabase
      .from("PromoCode")
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) {
      logger.error("[AdminRepository] Error fetching promo codes:", error);
      throw new Error(`Failed to fetch promo codes: ${error.message}`);
    }

    return (promoCodes || []).map((pc) => ({
      id: pc.id,
      code: pc.code,
      discountType: pc.discountType,
      discountValue: parseFloat(pc.discountValue),
      duration: pc.duration,
      durationInMonths: pc.durationInMonths,
      maxRedemptions: pc.maxRedemptions,
      expiresAt: pc.expiresAt ? new Date(pc.expiresAt) : null,
      isActive: pc.isActive,
      stripeCouponId: pc.stripeCouponId,
      planIds: (pc.planIds || []) as string[],
      createdAt: new Date(pc.createdAt),
      updatedAt: new Date(pc.updatedAt),
    }));
  }

  /**
   * Create a promo code
   */
  async createPromoCode(data: {
    id: string;
    code: string;
    discountType: "percent" | "fixed";
    discountValue: number;
    duration: "once" | "forever" | "repeating";
    durationInMonths?: number | null;
    maxRedemptions?: number | null;
    expiresAt?: Date | null;
    isActive: boolean;
    stripeCouponId: string;
    planIds: string[];
  }): Promise<PromoCode> {
    const supabase = await createServerClient();

    const { data: promoCode, error } = await supabase
      .from("PromoCode")
      .insert({
        id: data.id,
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        duration: data.duration,
        durationInMonths: data.durationInMonths || null,
        maxRedemptions: data.maxRedemptions || null,
        expiresAt: data.expiresAt?.toISOString() || null,
        isActive: data.isActive,
        stripeCouponId: data.stripeCouponId,
        planIds: data.planIds || [],
      })
      .select()
      .single();

    if (error) {
      logger.error("[AdminRepository] Error creating promo code:", error);
      throw new Error(`Failed to create promo code: ${error.message}`);
    }

    return {
      id: promoCode.id,
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: parseFloat(promoCode.discountValue),
      duration: promoCode.duration,
      durationInMonths: promoCode.durationInMonths,
      maxRedemptions: promoCode.maxRedemptions,
      expiresAt: promoCode.expiresAt ? new Date(promoCode.expiresAt) : null,
      isActive: promoCode.isActive,
      stripeCouponId: promoCode.stripeCouponId,
      planIds: (promoCode.planIds || []) as string[],
      createdAt: new Date(promoCode.createdAt),
      updatedAt: new Date(promoCode.updatedAt),
    };
  }

  /**
   * Update a promo code
   */
  async updatePromoCode(id: string, data: Partial<PromoCode>): Promise<PromoCode> {
    const supabase = await createServerClient();

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.discountType !== undefined) updateData.discountType = data.discountType;
    if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.durationInMonths !== undefined) updateData.durationInMonths = data.durationInMonths;
    if (data.maxRedemptions !== undefined) updateData.maxRedemptions = data.maxRedemptions;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt?.toISOString() || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.planIds !== undefined) updateData.planIds = data.planIds;

    const { data: promoCode, error } = await supabase
      .from("PromoCode")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("[AdminRepository] Error updating promo code:", error);
      throw new Error(`Failed to update promo code: ${error.message}`);
    }

    return {
      id: promoCode.id,
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: parseFloat(promoCode.discountValue),
      duration: promoCode.duration,
      durationInMonths: promoCode.durationInMonths,
      maxRedemptions: promoCode.maxRedemptions,
      expiresAt: promoCode.expiresAt ? new Date(promoCode.expiresAt) : null,
      isActive: promoCode.isActive,
      stripeCouponId: promoCode.stripeCouponId,
      planIds: (promoCode.planIds || []) as string[],
      createdAt: new Date(promoCode.createdAt),
      updatedAt: new Date(promoCode.updatedAt),
    };
  }

  /**
   * Delete a promo code
   */
  async deletePromoCode(id: string): Promise<void> {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from("PromoCode")
      .delete()
      .eq("id", id);

    if (error) {
      logger.error("[AdminRepository] Error deleting promo code:", error);
      throw new Error(`Failed to delete promo code: ${error.message}`);
    }
  }

  /**
   * Get all system groups
   */
  async getAllSystemGroups(): Promise<SystemGroup[]> {
    const supabase = await createServerClient();

    const { data: groups, error } = await supabase
      .from("Group")
      .select("*")
      .is("userId", null)
      .order("name", { ascending: true });

    if (error) {
      logger.error("[AdminRepository] Error fetching system groups:", error);
      throw new Error(`Failed to fetch system groups: ${error.message}`);
    }

    return (groups || []).map((g) => ({
      id: g.id,
      name: g.name,
      type: g.type as "income" | "expense" | null,
      createdAt: new Date(g.createdAt),
      updatedAt: new Date(g.updatedAt),
      userId: null,
    }));
  }

  /**
   * Create a system group
   */
  async createSystemGroup(data: { id: string; name: string; type?: "income" | "expense" }): Promise<SystemGroup> {
    const supabase = await createServerClient();

    const now = new Date().toISOString();
    const { data: group, error } = await supabase
      .from("Group")
      .insert({
        id: data.id,
        name: data.name,
        type: data.type || "expense",
        userId: null,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) {
      logger.error("[AdminRepository] Error creating system group:", error);
      throw new Error(`Failed to create system group: ${error.message}`);
    }

    return {
      id: group.id,
      name: group.name,
      type: group.type as "income" | "expense" | null,
      createdAt: new Date(group.createdAt),
      updatedAt: new Date(group.updatedAt),
      userId: null,
    };
  }

  /**
   * Update a system group
   */
  async updateSystemGroup(id: string, data: { name?: string; type?: "income" | "expense" }): Promise<SystemGroup> {
    const supabase = await createServerClient();

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;

    const { data: group, error } = await supabase
      .from("Group")
      .update(updateData)
      .eq("id", id)
      .is("userId", null)
      .select()
      .single();

    if (error) {
      logger.error("[AdminRepository] Error updating system group:", error);
      throw new Error(`Failed to update system group: ${error.message}`);
    }

    return {
      id: group.id,
      name: group.name,
      type: group.type as "income" | "expense" | null,
      createdAt: new Date(group.createdAt),
      updatedAt: new Date(group.updatedAt),
      userId: null,
    };
  }

  /**
   * Delete a system group
   */
  async deleteSystemGroup(id: string): Promise<void> {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from("Group")
      .delete()
      .eq("id", id)
      .is("userId", null);

    if (error) {
      logger.error("[AdminRepository] Error deleting system group:", error);
      throw new Error(`Failed to delete system group: ${error.message}`);
    }
  }

  /**
   * Get all system categories
   */
  async getAllSystemCategories(): Promise<SystemCategory[]> {
    const supabase = await createServerClient();

    const { data: categories, error } = await supabase
      .from("Category")
      .select(`
        *,
        group:Group(*),
        subcategories:Subcategory(*)
      `)
      .is("userId", null)
      .order("name", { ascending: true });

    if (error) {
      logger.error("[AdminRepository] Error fetching system categories:", error);
      throw new Error(`Failed to fetch system categories: ${error.message}`);
    }

    return (categories || []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      macroId: cat.groupId,
      createdAt: new Date(cat.createdAt),
      updatedAt: new Date(cat.updatedAt),
      userId: null,
      group: cat.group ? {
        id: cat.group.id,
        name: cat.group.name,
        type: (cat.group as any).type ?? null,
        createdAt: new Date(cat.group.createdAt),
        updatedAt: new Date(cat.group.updatedAt),
        userId: null,
      } : undefined,
      subcategories: (cat.subcategories || []).map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        categoryId: sub.categoryId,
        createdAt: new Date(sub.createdAt),
        updatedAt: new Date(sub.updatedAt),
        userId: null,
        logo: sub.logo || null,
      })),
    }));
  }

  /**
   * Create a system category
   */
  async createSystemCategory(data: { id: string; name: string; macroId: string }): Promise<SystemCategory> {
    const supabase = await createServerClient();

    const now = new Date().toISOString();
    const { data: category, error } = await supabase
      .from("Category")
      .insert({
        id: data.id,
        name: data.name,
        groupId: data.macroId,
        userId: null,
        createdAt: now,
        updatedAt: now,
      })
      .select(`
        *,
        group:Group(*),
        subcategories:Subcategory(*)
      `)
      .single();

    if (error) {
      logger.error("[AdminRepository] Error creating system category:", error);
      throw new Error(`Failed to create system category: ${error.message}`);
    }

    return {
      id: category.id,
      name: category.name,
      macroId: category.groupId,
      createdAt: new Date(category.createdAt),
      updatedAt: new Date(category.updatedAt),
      userId: null,
      group: category.group ? {
        id: category.group.id,
        name: category.group.name,
        type: (category.group as any).type ?? null,
        createdAt: new Date(category.group.createdAt),
        updatedAt: new Date(category.group.updatedAt),
        userId: null,
      } : undefined,
      subcategories: [],
    };
  }

  /**
   * Update a system category
   */
  async updateSystemCategory(id: string, data: { name?: string; macroId?: string }): Promise<SystemCategory> {
    const supabase = await createServerClient();

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.macroId !== undefined) updateData.groupId = data.macroId;

    const { data: category, error } = await supabase
      .from("Category")
      .update(updateData)
      .eq("id", id)
      .is("userId", null)
      .select(`
        *,
        group:Group(*),
        subcategories:Subcategory(*)
      `)
      .single();

    if (error) {
      logger.error("[AdminRepository] Error updating system category:", error);
      throw new Error(`Failed to update system category: ${error.message}`);
    }

    return {
      id: category.id,
      name: category.name,
      macroId: category.groupId,
      createdAt: new Date(category.createdAt),
      updatedAt: new Date(category.updatedAt),
      userId: null,
      group: category.group ? {
        id: category.group.id,
        name: category.group.name,
        type: (category.group as any).type ?? null,
        createdAt: new Date(category.group.createdAt),
        updatedAt: new Date(category.group.updatedAt),
        userId: null,
      } : undefined,
      subcategories: (category.subcategories || []).map((sub: any) => ({
        id: sub.id,
        name: sub.name,
        categoryId: sub.categoryId,
        createdAt: new Date(sub.createdAt),
        updatedAt: new Date(sub.updatedAt),
        userId: null,
        logo: sub.logo || null,
      })),
    };
  }

  /**
   * Delete a system category
   */
  async deleteSystemCategory(id: string): Promise<void> {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from("Category")
      .delete()
      .eq("id", id)
      .is("userId", null);

    if (error) {
      logger.error("[AdminRepository] Error deleting system category:", error);
      throw new Error(`Failed to delete system category: ${error.message}`);
    }
  }

  /**
   * Get all system subcategories
   */
  async getAllSystemSubcategories(): Promise<SystemSubcategory[]> {
    const supabase = await createServerClient();

    const { data: subcategories, error } = await supabase
      .from("Subcategory")
      .select("*")
      .is("userId", null)
      .order("name", { ascending: true });

    if (error) {
      logger.error("[AdminRepository] Error fetching system subcategories:", error);
      throw new Error(`Failed to fetch system subcategories: ${error.message}`);
    }

    return (subcategories || []).map((sub) => ({
      id: sub.id,
      name: sub.name,
      categoryId: sub.categoryId,
      createdAt: new Date(sub.createdAt),
      updatedAt: new Date(sub.updatedAt),
      userId: null,
      logo: sub.logo || null,
    }));
  }

  /**
   * Create a system subcategory
   */
  async createSystemSubcategory(data: { id: string; name: string; categoryId: string; logo?: string | null }): Promise<SystemSubcategory> {
    const supabase = await createServerClient();

    const now = new Date().toISOString();
    const { data: subcategory, error } = await supabase
      .from("Subcategory")
      .insert({
        id: data.id,
        name: data.name,
        categoryId: data.categoryId,
        userId: null,
        logo: data.logo || null,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) {
      logger.error("[AdminRepository] Error creating system subcategory:", error);
      throw new Error(`Failed to create system subcategory: ${error.message}`);
    }

    return {
      id: subcategory.id,
      name: subcategory.name,
      categoryId: subcategory.categoryId,
      createdAt: new Date(subcategory.createdAt),
      updatedAt: new Date(subcategory.updatedAt),
      userId: null,
      logo: subcategory.logo || null,
    };
  }

  /**
   * Update a system subcategory
   */
  async updateSystemSubcategory(id: string, data: { name?: string; logo?: string | null }): Promise<SystemSubcategory> {
    const supabase = await createServerClient();

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.logo !== undefined) updateData.logo = data.logo;

    const { data: subcategory, error } = await supabase
      .from("Subcategory")
      .update(updateData)
      .eq("id", id)
      .is("userId", null)
      .select()
      .single();

    if (error) {
      logger.error("[AdminRepository] Error updating system subcategory:", error);
      throw new Error(`Failed to update system subcategory: ${error.message}`);
    }

    return {
      id: subcategory.id,
      name: subcategory.name,
      categoryId: subcategory.categoryId,
      createdAt: new Date(subcategory.createdAt),
      updatedAt: new Date(subcategory.updatedAt),
      userId: null,
      logo: subcategory.logo || null,
    };
  }

  /**
   * Delete a system subcategory
   */
  async deleteSystemSubcategory(id: string): Promise<void> {
    const supabase = await createServerClient();

    const { error } = await supabase
      .from("Subcategory")
      .delete()
      .eq("id", id)
      .is("userId", null);

    if (error) {
      logger.error("[AdminRepository] Error deleting system subcategory:", error);
      throw new Error(`Failed to delete system subcategory: ${error.message}`);
    }
  }

  /**
   * Get dashboard data (users, subscriptions, plans)
   */
  async getDashboardData(): Promise<{
    totalUsers: number;
    subscriptions: any[];
    plans: any[];
  }> {
    const supabase = createServiceRoleClient();

    // Get all users count
    const { count: totalUsers, error: usersError } = await supabase
      .from("User")
      .select("*", { count: "exact", head: true });

    if (usersError) {
      logger.error("[AdminRepository] Error fetching users count:", usersError);
      throw new Error(`Failed to fetch users count: ${usersError.message}`);
    }

    // Get all subscriptions with their plans
    const { data: subscriptions, error: subsError } = await supabase
      .from("Subscription")
      .select(`
        id,
        userId,
        planId,
        status,
        trialStartDate,
        trialEndDate,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        stripeSubscriptionId,
        plan:Plan(
          id,
          name,
          priceMonthly,
          priceYearly,
          stripePriceIdMonthly,
          stripePriceIdYearly
        )
      `)
      .order("createdAt", { ascending: false });

    if (subsError) {
      logger.error("[AdminRepository] Error fetching subscriptions:", subsError);
      throw new Error(`Failed to fetch subscriptions: ${subsError.message}`);
    }

    // Get all plans
    const { data: plans, error: plansError } = await supabase
      .from("Plan")
      .select("id, name, priceMonthly, priceYearly")
      .order("priceMonthly", { ascending: true });

    if (plansError) {
      logger.error("[AdminRepository] Error fetching plans:", plansError);
      throw new Error(`Failed to fetch plans: ${plansError.message}`);
    }

    return {
      totalUsers: totalUsers || 0,
      subscriptions: subscriptions || [],
      plans: plans || [],
    };
  }

  /**
   * Get system settings
   */
  async getSystemSettings(): Promise<{ maintenanceMode: boolean }> {
    const supabase = createServiceRoleClient();

    const { data: settings, error } = await supabase
      .from("SystemSettings")
      .select("*")
      .eq("id", "default")
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" - we'll return default if it doesn't exist
      logger.error("[AdminRepository] Error fetching system settings:", error);
      throw new Error(`Failed to fetch system settings: ${error.message}`);
    }

    // If no settings exist, return default
    if (!settings) {
      return { maintenanceMode: false };
    }

    return {
      maintenanceMode: settings.maintenanceMode || false,
    };
  }

  /**
   * Update system settings
   */
  async updateSystemSettings(data: { maintenanceMode: boolean }): Promise<{ maintenanceMode: boolean }> {
    const supabase = createServiceRoleClient();

    // Try to update existing settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from("SystemSettings")
      .update({
        maintenanceMode: data.maintenanceMode,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", "default")
      .select()
      .single();

    // If update failed because row doesn't exist, create it
    if (updateError && updateError.code === "PGRST116") {
      const { data: newSettings, error: insertError } = await supabase
        .from("SystemSettings")
        .insert({
          id: "default",
          maintenanceMode: data.maintenanceMode,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        logger.error("[AdminRepository] Error creating system settings:", insertError);
        throw new Error(`Failed to create system settings: ${insertError.message}`);
      }

      return {
        maintenanceMode: newSettings.maintenanceMode,
      };
    }

    if (updateError) {
      logger.error("[AdminRepository] Error updating system settings:", updateError);
      throw new Error(`Failed to update system settings: ${updateError.message}`);
    }

    return {
      maintenanceMode: updatedSettings?.maintenanceMode || false,
    };
  }

  /**
   * Get all plans
   */
  async getAllPlans(): Promise<any[]> {
    const supabase = createServiceRoleClient();

    const { data: plans, error } = await supabase
      .from("Plan")
      .select("*")
      .order("priceMonthly", { ascending: true });

    if (error) {
      logger.error("[AdminRepository] Error fetching plans:", error);
      throw new Error(`Failed to fetch plans: ${error.message}`);
    }

    return plans || [];
  }

  /**
   * Update a plan
   */
  async updatePlan(
    planId: string,
    data: {
      name?: string;
      features?: any;
      priceMonthly?: number;
      priceYearly?: number;
    }
  ): Promise<any> {
    const supabase = createServiceRoleClient();

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.features !== undefined) updateData.features = data.features;
    if (data.priceMonthly !== undefined) updateData.priceMonthly = data.priceMonthly;
    if (data.priceYearly !== undefined) updateData.priceYearly = data.priceYearly;

    const { data: updatedPlan, error } = await supabase
      .from("Plan")
      .update(updateData)
      .eq("id", planId)
      .select()
      .single();

    if (error) {
      logger.error("[AdminRepository] Error updating plan:", error);
      throw new Error(`Failed to update plan: ${error.message}`);
    }

    if (!updatedPlan) {
      throw new Error("Plan update succeeded but no data returned");
    }

    return updatedPlan;
  }

  /**
   * Get all feedbacks with pagination and metrics
   */
  async getFeedbacks(options?: { limit?: number; offset?: number }): Promise<{
    feedbacks: any[];
    total: number;
    metrics: {
      total: number;
      averageRating: number;
      ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
      };
    };
  }> {
    const supabase = createServiceRoleClient();
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    // Get feedbacks with user info
    const { data: feedbacks, error: feedbacksError } = await supabase
      .from("Feedback")
      .select(`
        id,
        userId,
        rating,
        feedback,
        createdAt,
        updatedAt,
        User:userId (
          id,
          name,
          email
        )
      `)
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    if (feedbacksError) {
      logger.error("[AdminRepository] Error fetching feedbacks:", feedbacksError);
      throw new Error(`Failed to fetch feedbacks: ${feedbacksError.message}`);
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from("Feedback")
      .select("*", { count: "exact", head: true });

    if (countError) {
      logger.error("[AdminRepository] Error fetching feedback count:", countError);
    }

    // Get all feedbacks for metrics
    const { data: allFeedbacks, error: allFeedbacksError } = await supabase
      .from("Feedback")
      .select("rating");

    if (allFeedbacksError) {
      logger.error("[AdminRepository] Error fetching all feedbacks for metrics:", allFeedbacksError);
    }

    const metrics = {
      total: count || 0,
      averageRating: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    };

    if (allFeedbacks && allFeedbacks.length > 0) {
      const totalRating = allFeedbacks.reduce((sum, f) => sum + f.rating, 0);
      metrics.averageRating = totalRating / allFeedbacks.length;

      allFeedbacks.forEach((f) => {
        if (f.rating >= 1 && f.rating <= 5) {
          metrics.ratingDistribution[f.rating as keyof typeof metrics.ratingDistribution]++;
        }
      });
    }

    return {
      feedbacks: feedbacks || [],
      total: count || 0,
      metrics,
    };
  }

  /**
   * Get all contact forms with pagination
   */
  async getContactForms(options?: { status?: string; limit?: number; offset?: number }): Promise<{
    contactForms: any[];
    total: number;
  }> {
    const supabase = createServiceRoleClient();
    const limit = options?.limit || 100;
    const offset = options?.offset || 0;

    // Build query
    let query = supabase
      .from("ContactForm")
      .select(`
        id,
        userId,
        name,
        email,
        subject,
        message,
        status,
        adminNotes,
        createdAt,
        updatedAt,
        User:userId (
          id,
          name,
          email
        )
      `)
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (options?.status) {
      query = query.eq("status", options.status);
    }

    const { data, error } = await query;

    if (error) {
      logger.error("[AdminRepository] Error fetching contact forms:", error);
      throw new Error(`Failed to fetch contact forms: ${error.message}`);
    }

    // Get total count
    let countQuery = supabase.from("ContactForm").select("*", { count: "exact", head: true });
    if (options?.status) {
      countQuery = countQuery.eq("status", options.status);
    }
    const { count, error: countError } = await countQuery;

    if (countError) {
      logger.error("[AdminRepository] Error fetching contact form count:", countError);
    }

    return {
      contactForms: data || [],
      total: count || 0,
    };
  }

  /**
   * Update a contact form
   */
  async updateContactForm(
    id: string,
    data: {
      status?: string;
      adminNotes?: string;
    }
  ): Promise<any> {
    const supabase = createServiceRoleClient();

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (data.status !== undefined) updateData.status = data.status;
    if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;

    const { data: updatedContactForm, error } = await supabase
      .from("ContactForm")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("[AdminRepository] Error updating contact form:", error);
      throw new Error(`Failed to update contact form: ${error.message}`);
    }

    if (!updatedContactForm) {
      throw new Error("Contact form update succeeded but no data returned");
    }

    return updatedContactForm;
  }

  /**
   * Get dashboard raw data (users, subscriptions, plans)
   */
  async getDashboardRawData(): Promise<{
    totalUsers: number | null;
    subscriptions: any[];
    plans: any[];
  }> {
    const supabase = createServiceRoleClient();

    // Get all users count
    const { count: totalUsers, error: usersError } = await supabase
      .from("User")
      .select("*", { count: "exact", head: true });

    if (usersError) {
      logger.error("[AdminRepository] Error fetching users count:", usersError);
    }

    // Get all subscriptions with their plans
    const { data: subscriptions, error: subsError } = await supabase
      .from("Subscription")
      .select(`
        id,
        userId,
        planId,
        status,
        trialStartDate,
        trialEndDate,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        stripeSubscriptionId,
        plan:Plan(
          id,
          name,
          priceMonthly,
          priceYearly,
          stripePriceIdMonthly,
          stripePriceIdYearly
        )
      `)
      .order("createdAt", { ascending: false });

    if (subsError) {
      logger.error("[AdminRepository] Error fetching subscriptions:", subsError);
    }

    // Get all plans
    const { data: plans, error: plansError } = await supabase
      .from("Plan")
      .select("id, name, priceMonthly, priceYearly")
      .order("priceMonthly", { ascending: true });

    if (plansError) {
      logger.error("[AdminRepository] Error fetching plans:", plansError);
    }

    return {
      totalUsers: totalUsers || null,
      subscriptions: subscriptions || [],
      plans: plans || [],
    };
  }
}

