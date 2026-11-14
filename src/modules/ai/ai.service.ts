import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { RegionalDatabaseManager } from '../../database/regional-database.manager';
import { Task, TaskSchema, TaskStatus, TaskPriority } from '../tasks/schemas/task.schema';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema';
import { Attendance, AttendanceSchema } from '../attendance/schemas/attendance.schema';
import { Department, DepartmentSchema } from '../departments/schemas/department.schema';
import { Meeting, MeetingSchema } from '../meetings/schemas/meeting.schema';
import { Message, MessageSchema } from '../chat/schemas/message.schema';
import { Company, CompanySchema, SubscriptionPlan } from '../companies/schemas/company.schema';
import { TenantContext } from '../../common/decorators/current-tenant.decorator';
import { JwtPayload } from '../auth/jwt.strategy';
import { PERMISSIONS } from '../../common/constants/permissions.constant';

export interface EmailDraftResult {
  subject: string;
  body: string;
  modelUsed: string;
}

export interface ParsedTaskResult {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  assigneeName?: string;
  modelUsed: string;
}

export interface TopPerformer {
  rank: number;
  employeeId: string;
  name: string;
  email: string;
  departmentName?: string;
  avatarUrl?: string;
  score: number;
  completedTasksCount: number;
  punctualityRate: number;
  badge: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly regionalDbManager: RegionalDatabaseManager,
  ) {}

  private getGeminiApiKey(): string | undefined {
    return (
      this.configService.get<string>('GEMINI_API_KEY') ||
      process.env.GEMINI_API_KEY
    );
  }

  getGeminiModel(): string {
    return (
      this.configService.get<string>('GEMINI_MODEL') ||
      process.env.GEMINI_MODEL ||
      'gemini-2.5-flash'
    );
  }

  // Resilient Gemini content generation helper with automatic fallback across supported model versions
  async callGemini(
    prompt: string,
    options: {
      temperature?: number;
      responseMimeType?: string;
      maxOutputTokens?: number;
    } = {},
  ): Promise<string | null> {
    const apiKey = this.getGeminiApiKey();
    if (!apiKey) return null;

    const modelsToTry = [
      this.getGeminiModel(),
      'gemini-2.5-flash',
      'gemini-1.5-flash',
    ];
    const uniqueModels = Array.from(new Set(modelsToTry));

    for (const model of uniqueModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const body: Record<string, any> = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options.temperature ?? 0.4,
          },
        };
        if (options.responseMimeType) {
          body.generationConfig.responseMimeType = options.responseMimeType;
        }
        if (options.maxOutputTokens) {
          body.generationConfig.maxOutputTokens = options.maxOutputTokens;
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            return rawText;
          }
        } else {
          const errText = await response.text();
          this.logger.warn(`Gemini call to ${model} returned ${response.status}: ${errText.slice(0, 150)}`);
        }
      } catch (err: any) {
        this.logger.warn(`Gemini call to ${model} failed: ${err.message}`);
      }
    }
    return null;
  }

  /** Builds an RBAC-enforced telemetry data context object for Gemini AI processing. */
  async buildRbacWorkspaceContext(
    tenant: TenantContext,
    user: JwtPayload,
  ): Promise<Record<string, any>> {
    const isOwner = user.isOwner || user.role === 'OWNER';
    const perms = Array.isArray(user.permissions) ? user.permissions : [];
    const rbacContext: Record<string, any> = {
      currentUser: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        isOwner,
      },
    };

    try {
      // 1. Employees Telemetry
      if (isOwner || perms.includes(PERMISSIONS.EMPLOYEES_VIEW)) {
        const empModel = await this.regionalDbManager.getModel<Employee>(
          tenant.region,
          Employee.name,
          EmployeeSchema,
        );
        const emps = await empModel
          .find({ companyId: tenant.companyId })
          .select('employeeId firstName lastName email designation departmentName status')
          .limit(50)
          .lean();
        rbacContext.employees = emps.map((e) => ({
          name: `${e.firstName} ${e.lastName}`,
          email: e.email,
          designation: e.designation,
          department: e.departmentName,
          status: e.status,
        }));
      } else {
        const empModel = await this.regionalDbManager.getModel<Employee>(
          tenant.region,
          Employee.name,
          EmployeeSchema,
        );
        const selfEmp = await empModel
          .findOne({ companyId: tenant.companyId, email: user.email })
          .select('employeeId firstName lastName email designation departmentName status')
          .lean();
        if (selfEmp) {
          rbacContext.employees = [
            {
              name: `${selfEmp.firstName} ${selfEmp.lastName}`,
              email: selfEmp.email,
              designation: selfEmp.designation,
              department: selfEmp.departmentName,
              status: selfEmp.status,
            },
          ];
        }
      }

      // 2. Attendance Telemetry
      if (isOwner || perms.includes(PERMISSIONS.ATTENDANCE_VIEW)) {
        const attModel = await this.regionalDbManager.getModel<Attendance>(
          tenant.region,
          Attendance.name,
          AttendanceSchema,
        );
        const atts = await attModel
          .find({ companyId: tenant.companyId })
          .sort({ date: -1 })
          .limit(50)
          .lean();
        rbacContext.attendanceRecords = atts.map((a) => ({
          employeeName: a.employeeName,
          date: a.date,
          clockInTime: a.clockInTime,
          clockOutTime: a.clockOutTime,
          totalHours: a.totalHours,
          status: a.status,
        }));
      } else {
        const attModel = await this.regionalDbManager.getModel<Attendance>(
          tenant.region,
          Attendance.name,
          AttendanceSchema,
        );
        const atts = await attModel
          .find({ companyId: tenant.companyId, userId: user.userId })
          .sort({ date: -1 })
          .limit(20)
          .lean();
        rbacContext.attendanceRecords = atts.map((a) => ({
          employeeName: a.employeeName,
          date: a.date,
          clockInTime: a.clockInTime,
          clockOutTime: a.clockOutTime,
          totalHours: a.totalHours,
          status: a.status,
        }));
      }

      // 3. Tasks Telemetry
      if (isOwner || perms.includes(PERMISSIONS.TASKS_VIEW)) {
        const taskModel = await this.regionalDbManager.getModel<Task>(
          tenant.region,
          Task.name,
          TaskSchema,
        );
        const tasks = await taskModel
          .find({ companyId: tenant.companyId })
          .select('title description status priority assigneeName dueDate')
          .limit(50)
          .lean();
        rbacContext.tasks = tasks.map((t) => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          assignee: t.assigneeName,
          dueDate: t.dueDate,
        }));
      } else {
        const taskModel = await this.regionalDbManager.getModel<Task>(
          tenant.region,
          Task.name,
          TaskSchema,
        );
        const tasks = await taskModel
          .find({
            companyId: tenant.companyId,
            $or: [{ assigneeId: user.userId }, { createdById: user.userId }],
          })
          .select('title description status priority assigneeName dueDate')
          .limit(25)
          .lean();
        rbacContext.tasks = tasks.map((t) => ({
          title: t.title,
          status: t.status,
          priority: t.priority,
          assignee: t.assigneeName,
          dueDate: t.dueDate,
        }));
      }

      // 4. Departments Telemetry (if permitted)
      if (isOwner || perms.includes(PERMISSIONS.DEPARTMENTS_VIEW)) {
        const deptModel = await this.regionalDbManager.getModel<Department>(
          tenant.region,
          Department.name,
          DepartmentSchema,
        );
        const depts = await deptModel
          .find({ companyId: tenant.companyId })
          .select('name description employeeCount')
          .lean();
        rbacContext.departments = depts.map((d) => ({
          name: d.name,
          description: d.description,
          employeeCount: d.employeeCount,
        }));
      }

      // 5. Meetings Telemetry (if permitted)
      if (isOwner || perms.includes(PERMISSIONS.MEETINGS_VIEW)) {
        const meetModel = await this.regionalDbManager.getModel<Meeting>(
          tenant.region,
          Meeting.name,
          MeetingSchema,
        );
        const meets = await meetModel
          .find({ companyId: tenant.companyId })
          .sort({ startTime: -1 })
          .limit(20)
          .lean();
        rbacContext.meetings = meets.map((m) => ({
          title: m.title,
          startTime: m.startTime,
          status: m.status,
        }));
      }
    } catch (err: any) {
      this.logger.warn(`Failed to build RBAC workspace context: ${err.message}`);
    }

    return rbacContext;
  }

  // General Q&A Assistant for workspace questions & natural language instructions with RBAC context
  async askAi(
    tenant: TenantContext,
    user: JwtPayload,
    promptText: string,
    dtoContext?: Record<string, any>,
  ): Promise<{ answer: string; modelUsed: string }> {
    const rbacTelemetry = await this.buildRbacWorkspaceContext(tenant, user);
    const combinedContext = {
      ...dtoContext,
      ...rbacTelemetry,
    };

    const systemPrompt = `You are WorkivLab AI Assistant, an enterprise workspace intelligence co-pilot.
Answer the user's question clearly, accurately, and professionally based strictly on their authorized workspace context below.

STRICT FORMATTING & UI RULES (ChatGPT & DeepSeek Style):
1. **Markdown Tables for Lists**: Whenever the user asks to see or list items (e.g. "show me all employees today attendance", "list team members", "show open tasks", "show meetings", "show departments"), ALWAYS format the records in a clean Markdown table with clear column headers like:
   | Name | Role / Department | Status | Details / Clock-In |
   | ---- | ----------------- | ------ | ------------------ |
   | ...  | ...               | ...    | ...                |
2. **Clean Formatting**: Use section headers (### Section Title), bold metrics (**Metric Name:** Value), and clean bullet points (- Item).
3. **No Raw Noise or Asterisk Chaos**: Never output garbled text, repeating raw characters like "*hhhhhh*", or unformatted noise. Keep formatting polished and direct.
4. **Data Accuracy**: Extract exact names, designation, attendance status, clock-in times, task priorities, and dates from the Authorized Workspace Context provided. If no attendance record exists for today, state that clearly and list the team roster or available attendance records in a clean table.

User Info: ${user.email} (Role: ${user.role}, Owner: ${user.isOwner || user.role === 'OWNER'})

Authorized Workspace Context & Data:
${JSON.stringify(combinedContext, null, 2)}

User Request: "${promptText}"`;

    const text = await this.callGemini(systemPrompt, { temperature: 0.3, maxOutputTokens: 1500 });
    if (text) {
      return { answer: text.trim(), modelUsed: this.getGeminiModel() };
    }

    return {
      answer: `### WorkivLab Workspace Intelligence Co-Pilot\nI am here to assist you with workspace operations, attendance tracking, team analytics, tasks, and project boards. How can I help you today?`,
      modelUsed: 'intelligent-template',
    };
  }

  // checkAiAccess: verifies user permissions, checks monthly AI quota, and increments request count
  async checkAiAccess(tenant: TenantContext, user: JwtPayload): Promise<void> {
    const isOwner = user.isOwner || user.role === 'OWNER';
    const hasAiPerm = user.permissions?.includes(PERMISSIONS.AI_TOOLS_USE);
    if (!isOwner && !hasAiPerm) {
      throw new ForbiddenException(
        'You do not have permission to utilize AI Assistant tools. Please contact your company administrator.',
      );
    }

    const companyModel = await this.regionalDbManager.getModel<Company>(
      tenant.region,
      Company.name,
      CompanySchema,
    );
    const company = await companyModel.findOne({ companyId: tenant.companyId });
    if (!company) {
      return;
    }

    const now = new Date();
    const resetDate = company.subscription?.aiCycleResetDate
      ? new Date(company.subscription.aiCycleResetDate)
      : new Date(0);
    const isNewCycle =
      now.getMonth() !== resetDate.getMonth() ||
      now.getFullYear() !== resetDate.getFullYear();

    if (isNewCycle) {
      if (!company.subscription) {
        (company as any).subscription = {};
      }
      company.subscription.aiRequestsUsedThisMonth = 0;
      company.subscription.aiCycleResetDate = now;
      await company.save();
    }

    const plan = company.subscription?.plan || SubscriptionPlan.PRO;
    let limit = 5000;
    if (plan === SubscriptionPlan.STARTER) {
      limit = 1000;
    } else if (plan === SubscriptionPlan.ENTERPRISE) {
      limit = -1;
    } else if (company.subscription?.aiRequestLimit !== undefined) {
      limit = company.subscription.aiRequestLimit;
    }

    const used = company.subscription?.aiRequestsUsedThisMonth || 0;
    if (limit !== -1 && used >= limit) {
      throw new ForbiddenException(
        `AI monthly limit of ${limit} requests reached for your ${plan} plan. Please wait for the new cycle or upgrade your plan in Settings.`,
      );
    }

    await companyModel.updateOne(
      { companyId: tenant.companyId },
      { $inc: { 'subscription.aiRequestsUsedThisMonth': 1 } },
    );
  }

  // Parse natural language prompt into structured task
  async parseTaskPrompt(promptText: string): Promise<ParsedTaskResult> {
    const prompt = `You are an AI assistant for a project management system.
Extract structured task fields from the following natural language request:
"${promptText}"

Current Date: ${new Date().toISOString().split('T')[0]}

Return ONLY a JSON object with this exact schema:
{
  "title": "Clear concise task title",
  "description": "Elaborated task description or empty string",
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "dueDate": "YYYY-MM-DD or null",
  "assigneeName": "Name of person mentioned to assign or null"
}`;

    const rawText = await this.callGemini(prompt, {
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    if (rawText) {
      try {
        const parsed = JSON.parse(rawText);
        return {
          title: parsed.title || promptText.slice(0, 50),
          description: parsed.description || '',
          priority: (parsed.priority as TaskPriority) || TaskPriority.MEDIUM,
          dueDate: parsed.dueDate || undefined,
          assigneeName: parsed.assigneeName || undefined,
          modelUsed: this.getGeminiModel(),
        };
      } catch (err: any) {
        this.logger.warn(`Failed to parse Gemini task JSON: ${err.message}`);
      }
    }

    // Heuristic fallback
    let priority = TaskPriority.MEDIUM;
    const lower = promptText.toLowerCase();
    if (lower.includes('urgent') || lower.includes('asap') || lower.includes('critical')) {
      priority = TaskPriority.URGENT;
    } else if (lower.includes('high priority') || lower.includes('high')) {
      priority = TaskPriority.HIGH;
    } else if (lower.includes('low priority') || lower.includes('minor')) {
      priority = TaskPriority.LOW;
    }

    let dueDate: string | undefined;
    if (lower.includes('tomorrow')) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      dueDate = d.toISOString().split('T')[0];
    } else if (lower.includes('next week')) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      dueDate = d.toISOString().split('T')[0];
    }

    const title = promptText
      .replace(/^(create task|add task|make a task|new task):?\s*/i, '')
      .split(/(?:assign to|due|priority)/i)[0]
      .trim();

    return {
      title: title || promptText.slice(0, 60),
      description: promptText,
      priority,
      dueDate,
      modelUsed: 'intelligent-template',
    };
  }

  // Generate Social Media Post (LinkedIn, Twitter, Facebook, Instagram)
  async generateSocialPost(
    topic: string,
    platform: string,
    tone = 'engaging',
    companyName = 'WorkivLab',
  ): Promise<{ content: string; hashtags: string[]; platform: string; modelUsed: string }> {
    const prompt = `You are a world-class social media strategist for "${companyName}".
Generate a high-converting, professional post for ${platform.toUpperCase()}.
Topic: "${topic}"
Tone: "${tone}"

Format specifications for ${platform.toUpperCase()}:
- LinkedIn: Hook, formatted body with line breaks, 3-5 high-relevance hashtags.
- Twitter/X: Punchy, under 280 characters, crisp hook, 2 hashtags.
- Facebook: Friendly, engaging community tone, call to action.
- Instagram: Visual hook description suggestion, conversational caption, 10 trending hashtags.

Return ONLY a JSON object:
{
  "content": "Full formatted post content here",
  "hashtags": ["#tag1", "#tag2", "#tag3"]
}`;

    const rawText = await this.callGemini(prompt, {
      temperature: 0.7,
      responseMimeType: 'application/json',
    });

    if (rawText) {
      try {
        const parsed = JSON.parse(rawText);
        return {
          content: parsed.content,
          hashtags: parsed.hashtags || [],
          platform,
          modelUsed: this.getGeminiModel(),
        };
      } catch (err: any) {
        this.logger.warn(`Failed to parse Gemini social post JSON: ${err.message}`);
      }
    }

    const defaultHashtags = ['#Innovation', '#Productivity', '#WorkivLab', '#Leadership'];
    const content = `🚀 Exciting updates from ${companyName}!\n\nWe're thrilled to share our latest momentum around ${topic}.\n\nCollaboration, efficiency, and real-time execution drive everything we do. What are your thoughts on this?\n\nDrop your perspective below! 👇`;

    return {
      content,
      hashtags: defaultHashtags,
      platform,
      modelUsed: 'intelligent-template',
    };
  }

  // Generate Email Draft
  async generateEmailDraft(
    topic: string,
    tone = 'professional',
    companyName = 'WorkivLab',
    audience = 'all employees',
  ): Promise<EmailDraftResult> {
    const prompt = `You are a corporate communications executive for "${companyName}".
Write an engaging, clear, and high-impact email announcement for "${audience}".
Topic: "${topic}"
Tone: "${tone}"

Return ONLY a JSON object with this exact shape:
{
  "subject": "Compelling subject line here",
  "body": "Formatted email body in clean paragraph text or bullet points"
}`;

    const rawText = await this.callGemini(prompt, {
      temperature: 0.7,
      responseMimeType: 'application/json',
    });

    if (rawText) {
      try {
        const parsed = JSON.parse(rawText);
        if (parsed.subject && parsed.body) {
          return {
            subject: parsed.subject,
            body: parsed.body,
            modelUsed: this.getGeminiModel(),
          };
        }
      } catch (err: any) {
        this.logger.warn(`Failed to parse Gemini email draft JSON: ${err.message}`);
      }
    }

    const capitalizedTopic = topic.charAt(0).toUpperCase() + topic.slice(1).trim();
    return {
      subject: `Important Notice: ${capitalizedTopic} — ${companyName}`,
      body: `Dear Team,\n\nWe are pleased to share an update regarding ${topic}.\n\nPlease review the operational schedule and align with your respective team leads.\n\nBest regards,\n${companyName} Management`,
      modelUsed: 'intelligent-template',
    };
  }

  // Generate Executive Operations Report
  async generateExecutiveReport(
    analytics: Record<string, any>,
    companyName = 'WorkivLab',
  ): Promise<{ reportMarkdown: string; modelUsed: string }> {
    const prompt = `You are a Chief Operations Officer & Data Analyst reviewing operational telemetry for "${companyName}".
Analyze the following telemetry data and generate a comprehensive, executive-ready markdown report:
${JSON.stringify(analytics, null, 2)}`;

    const rawText = await this.callGemini(prompt, {
      temperature: 0.4,
      maxOutputTokens: 2500,
    });

    if (rawText) {
      return {
        reportMarkdown: rawText,
        modelUsed: this.getGeminiModel(),
      };
    }

    const total = analytics.totalEmployees || 0;
    const active = analytics.activeEmployees || 0;
    const reportMarkdown = `# Executive Operations Report\n**Organization:** ${companyName}\n- **Total Headcount:** ${total}\n- **Active Employees:** ${active}\n- **Task Velocity:** High\n`;

    return {
      reportMarkdown,
      modelUsed: 'intelligent-template',
    };
  }

  // Calculate Top Performers of the Month (AI Leaderboard)
  async calculateTopPerformers(tenant: TenantContext): Promise<TopPerformer[]> {
    const empModel = await this.regionalDbManager.getModel<Employee>(
      tenant.region,
      Employee.name,
      EmployeeSchema,
    );
    const taskModel = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );
    const attModel = await this.regionalDbManager.getModel<Attendance>(
      tenant.region,
      Attendance.name,
      AttendanceSchema,
    );

    const employees = await empModel
      .find({ companyId: tenant.companyId, status: 'ACTIVE' })
      .lean();

    const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const leaderboard: Array<{
      employeeId: string;
      name: string;
      email: string;
      departmentName?: string;
      avatarUrl?: string;
      score: number;
      completedTasksCount: number;
      punctualityRate: number;
    }> = [];

    for (const emp of employees) {
      // Completed tasks
      const completedTasks = await taskModel.countDocuments({
        companyId: tenant.companyId,
        $or: [
          { assigneeId: emp.employeeId },
          { 'assignees.userId': emp.userId || emp.employeeId },
        ],
        status: TaskStatus.COMPLETED,
      });

      // Attendance records for current month
      const attendances = await attModel
        .find({
          companyId: tenant.companyId,
          employeeId: emp.employeeId,
          date: { $regex: `^${currentMonth}` },
        })
        .lean();

      let onTimeCount = 0;
      for (const att of attendances) {
        if (!att.isLate && att.status === 'PRESENT') {
          onTimeCount++;
        }
      }

      const totalAtt = attendances.length;
      const punctualityRate = totalAtt > 0 ? Math.round((onTimeCount / totalAtt) * 100) : 100;

      // Score formula: (completedTasks * 10) + (punctualityRate * 0.5)
      const score = Math.round(completedTasks * 10 + punctualityRate * 0.5);

      leaderboard.push({
        employeeId: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        departmentName: emp.departmentName,
        avatarUrl: emp.avatarUrl,
        score,
        completedTasksCount: completedTasks,
        punctualityRate,
      });
    }

    // Sort descending by score
    leaderboard.sort((a, b) => b.score - a.score);

    const badges = ['🥇 MVP of the Month', '🥈 Top Contributor', '🥉 High Achiever'];
    return leaderboard.slice(0, 3).map((item, idx) => ({
      rank: idx + 1,
      ...item,
      badge: badges[idx] || '⭐ Star Performer',
    }));
  }

  // RBAC-Enforced AI Smart Search
  async smartSearch(
    tenant: TenantContext,
    user: JwtPayload,
    queryText: string,
  ): Promise<{ results: Array<{ type: string; title: string; subtitle?: string; link: string; icon: string }> }> {
    const results: Array<{ type: string; title: string; subtitle?: string; link: string; icon: string }> = [];
    const isOwner = user.isOwner || user.role === 'OWNER';
    const perms = user.permissions || [];
    const regex = new RegExp(queryText.trim(), 'i');

    // 1. Search Tasks (if TASKS_VIEW or Owner)
    if (isOwner || perms.includes(PERMISSIONS.TASKS_VIEW)) {
      const taskModel = await this.regionalDbManager.getModel<Task>(
        tenant.region,
        Task.name,
        TaskSchema,
      );
      const tasks = await taskModel
        .find({
          companyId: tenant.companyId,
          $or: [{ title: regex }, { description: regex }],
        })
        .limit(5)
        .lean();

      for (const t of tasks) {
        results.push({
          type: 'Task',
          title: t.title,
          subtitle: `Status: ${t.status} | Priority: ${t.priority}`,
          link: '/tasks',
          icon: 'lucideCheckSquare',
        });
      }
    }

    // 2. Search Employees (if EMPLOYEES_VIEW or Owner)
    if (isOwner || perms.includes(PERMISSIONS.EMPLOYEES_VIEW)) {
      const empModel = await this.regionalDbManager.getModel<Employee>(
        tenant.region,
        Employee.name,
        EmployeeSchema,
      );
      const emps = await empModel
        .find({
          companyId: tenant.companyId,
          $or: [{ firstName: regex }, { lastName: regex }, { email: regex }, { designation: regex }],
        })
        .limit(5)
        .lean();

      for (const e of emps) {
        results.push({
          type: 'Employee',
          title: `${e.firstName} ${e.lastName}`,
          subtitle: `${e.designation || 'Staff'} • ${e.departmentName || 'General'}`,
          link: '/employees',
          icon: 'lucideUsers',
        });
      }
    }

    // 3. Search Departments (if DEPARTMENTS_VIEW or Owner)
    if (isOwner || perms.includes(PERMISSIONS.DEPARTMENTS_VIEW)) {
      const deptModel = await this.regionalDbManager.getModel<Department>(
        tenant.region,
        Department.name,
        DepartmentSchema,
      );
      const depts = await deptModel
        .find({ companyId: tenant.companyId, name: regex })
        .limit(5)
        .lean();

      for (const d of depts) {
        results.push({
          type: 'Department',
          title: d.name,
          subtitle: d.description || 'Company Department',
          link: '/departments',
          icon: 'lucideBriefcase',
        });
      }
    }

    // 4. Search Meetings (if MEETINGS_VIEW or Owner)
    if (isOwner || perms.includes(PERMISSIONS.MEETINGS_VIEW)) {
      const meetModel = await this.regionalDbManager.getModel<Meeting>(
        tenant.region,
        Meeting.name,
        MeetingSchema,
      );
      const meets = await meetModel
        .find({ companyId: tenant.companyId, title: regex })
        .limit(5)
        .lean();

      for (const m of meets) {
        results.push({
          type: 'Meeting',
          title: m.title,
          subtitle: `Scheduled: ${new Date(m.startTime).toLocaleString()}`,
          link: '/meetings',
          icon: 'lucideVideo',
        });
      }
    }

    return { results };
  }

  // Dispatch AI Task Progress Report into Chat as Bot
  async dispatchTaskReport(
    tenant: TenantContext,
    user: JwtPayload,
    channelId = 'general',
    recipientId?: string,
  ): Promise<{ success: boolean; message: string }> {
    const taskModel = await this.regionalDbManager.getModel<Task>(
      tenant.region,
      Task.name,
      TaskSchema,
    );
    const msgModel = await this.regionalDbManager.getModel<Message>(
      tenant.region,
      Message.name,
      MessageSchema,
    );

    const tasks = await taskModel.find({ companyId: tenant.companyId }).lean();
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const inProgress = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length;
    const todo = tasks.filter((t) => t.status === TaskStatus.TODO).length;

    const reportContent = `🤖 **WorkivLab AI Task Progress Report**\n\n📊 **Sprint Overview:**\n• Total Active Tasks: ${total}\n• ✅ Completed: ${completed}\n• ⏳ In Progress: ${inProgress}\n• 📋 Backlog / Todo: ${todo}\n\n*Generated automatically by WorkivLab AI Assistant on ${new Date().toLocaleDateString()}.*`;

    await msgModel.create({
      messageId: `msg_${randomUUID()}`,
      companyId: tenant.companyId,
      channelId: recipientId ? `dm_${[user.userId, recipientId].sort().join('_')}` : channelId,
      senderId: 'system_ai_bot',
      senderName: 'WorkivLab AI Assistant',
      content: reportContent,
      type: 'TEXT',
      isDirect: !!recipientId,
      recipientId: recipientId || undefined,
    });

    return { success: true, message: 'AI task progress report dispatched successfully.' };
  }
}
