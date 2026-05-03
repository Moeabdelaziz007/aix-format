import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@/lib/redis';

// PUT /api/skills/[id] - Update skill
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { id } = params;

    // Validate required fields
    if (!body.name || !body.description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      );
    }

    // Get existing skill
    const existingSkill = await kv.get(`skill:${id}`);
    if (!existingSkill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Update skill
    const updatedSkill = {
      ...existingSkill,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`skill:${id}`, updatedSkill);

    return NextResponse.json({
      success: true,
      skill: updatedSkill,
    });
  } catch (error) {
    console.error('[Skills API] Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update skill' },
      { status: 500 }
    );
  }
}

// DELETE /api/skills/[id] - Delete skill
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if skill exists
    const skill = await kv.get(`skill:${id}`);
    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Delete skill
    await kv.del(`skill:${id}`);

    // Remove from user's skill list if exists
    const userId = request.headers.get('x-user-id');
    if (userId) {
      const userSkills = await kv.get<string[]>(`user:${userId}:skills`) || [];
      const updatedSkills = userSkills.filter((skillId) => skillId !== id);
      await kv.set(`user:${userId}:skills`, updatedSkills);
    }

    return NextResponse.json({
      success: true,
      message: 'Skill deleted successfully',
    });
  } catch (error) {
    console.error('[Skills API] Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete skill' },
      { status: 500 }
    );
  }
}

// Made with Moe Abdelaziz
