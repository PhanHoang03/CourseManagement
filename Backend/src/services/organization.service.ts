import prisma from '../config/database';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../utils/errors';
import { CreateOrganizationInput, UpdateOrganizationInput, GetOrganizationsQuery } from '../schemas/organization.schema';

class OrganizationService {
  async getAllOrganizations(query: GetOrganizationsQuery, requestingUserRole: string, requestingUserOrgId?: string) {
    // Ensure page and limit are numbers
    const page = typeof query.page === 'number' ? query.page : Number(query.page) || 1;
    const limit = typeof query.limit === 'number' ? query.limit : Number(query.limit) || 10;
    const { search, isActive, subscriptionTier } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Non-admins can only see their own organization
    if (requestingUserRole !== 'admin' && requestingUserOrgId) {
      where.id = requestingUserOrgId;
    }

    // Active status filtering
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Subscription tier filtering
    if (subscriptionTier) {
      where.subscriptionTier = subscriptionTier;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get organizations and total count
    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          logoUrl: true,
          subscriptionTier: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              departments: true,
              courses: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.organization.count({ where }),
    ]);

    return {
      organizations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrganizationById(organizationId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logoUrl: true,
        settings: true,
        subscriptionTier: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            departments: true,
            courses: true,
            sessions: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Non-admins can only view their own organization
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== organizationId) {
      throw new ForbiddenError('Access denied');
    }

    return organization;
  }

  async createOrganization(data: CreateOrganizationInput, requestingUserRole: string) {
    // Only super admins can create organizations (or admins if single-tenant)
    if (requestingUserRole !== 'admin') {
      throw new ForbiddenError('Only admins can create organizations');
    }

    // Check if organization with same name or slug exists
    const existingOrg = await prisma.organization.findFirst({
      where: {
        OR: [
          { name: data.name },
          { slug: data.slug },
          ...(data.domain ? [{ domain: data.domain }] : []),
        ],
      },
    });

    if (existingOrg) {
      if (existingOrg.name === data.name) {
        throw new ConflictError('Organization name already exists');
      }
      if (existingOrg.slug === data.slug) {
        throw new ConflictError('Organization slug already exists');
      }
      if (data.domain && existingOrg.domain === data.domain) {
        throw new ConflictError('Domain already in use');
      }
    }

    // Create organization
    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        domain: data.domain,
        logoUrl: data.logoUrl,
        settings: data.settings || {},
        subscriptionTier: data.subscriptionTier || 'free',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logoUrl: true,
        subscriptionTier: true,
        isActive: true,
        createdAt: true,
      },
    });

    return organization;
  }

  async updateOrganization(
    organizationId: string,
    data: UpdateOrganizationInput,
    requestingUserRole: string,
    requestingUserOrgId?: string
  ) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Only admins can update organizations
    if (requestingUserRole !== 'admin') {
      throw new ForbiddenError('Only admins can update organizations');
    }

    // Check for conflicts if updating name, slug, or domain
    if (data.name || data.slug || data.domain) {
      const whereClause: any = {
        id: { not: organizationId },
        OR: [],
      };

      if (data.name) {
        whereClause.OR.push({ name: data.name });
      }
      if (data.slug) {
        whereClause.OR.push({ slug: data.slug });
      }
      if (data.domain) {
        whereClause.OR.push({ domain: data.domain });
      }

      const existingOrg = await prisma.organization.findFirst({
        where: whereClause,
      });

      if (existingOrg) {
        if (data.name && existingOrg.name === data.name) {
          throw new ConflictError('Organization name already exists');
        }
        if (data.slug && existingOrg.slug === data.slug) {
          throw new ConflictError('Organization slug already exists');
        }
        if (data.domain && existingOrg.domain === data.domain) {
          throw new ConflictError('Domain already in use');
        }
      }
    }

    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: data.name,
        slug: data.slug,
        domain: data.domain,
        logoUrl: data.logoUrl,
        settings: data.settings,
        subscriptionTier: data.subscriptionTier,
        isActive: data.isActive,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logoUrl: true,
        settings: true,
        subscriptionTier: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updatedOrganization;
  }

  async deleteOrganization(organizationId: string, requestingUserRole: string) {
    if (requestingUserRole !== 'admin') {
      throw new ForbiddenError('Only admins can delete organizations');
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Prevent deletion if organization has users or departments
    if (organization._count.users > 0 || organization._count.departments > 0) {
      throw new ConflictError('Cannot delete organization with existing users or departments');
    }

    // Delete organization
    await prisma.organization.delete({
      where: { id: organizationId },
    });

    return { message: 'Organization deleted successfully' };
  }

  async getOrganizationStats(organizationId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Check access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== organizationId) {
      throw new ForbiddenError('Access denied');
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
      },
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Get statistics
    const [userCount, departmentCount, courseCount, activeUserCount] = await Promise.all([
      prisma.user.count({ where: { organizationId } }),
      prisma.department.count({ where: { organizationId, isActive: true } }),
      prisma.course.count({ where: { organizationId, status: 'published' } }),
      prisma.user.count({ where: { organizationId, isActive: true } }),
    ]);

    return {
      organization: {
        id: organization.id,
        name: organization.name,
      },
      stats: {
        totalUsers: userCount,
        activeUsers: activeUserCount,
        departments: departmentCount,
        publishedCourses: courseCount,
      },
    };
  }

  async getOrganizationSettings(organizationId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Check access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== organizationId) {
      throw new ForbiddenError('Access denied');
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        settings: true,
        subscriptionTier: true,
      },
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    return {
      settings: organization.settings,
      subscriptionTier: organization.subscriptionTier,
    };
  }

  async updateOrganizationSettings(
    organizationId: string,
    settings: Record<string, any>,
    requestingUserRole: string,
    requestingUserOrgId?: string
  ) {
    // Check access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== organizationId) {
      throw new ForbiddenError('Access denied');
    }

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Merge with existing settings
    const updatedSettings = {
      ...(organization.settings as Record<string, any> || {}),
      ...settings,
    };

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: { settings: updatedSettings },
      select: {
        id: true,
        settings: true,
        updatedAt: true,
      },
    });

    return updated;
  }
}

export default new OrganizationService();
