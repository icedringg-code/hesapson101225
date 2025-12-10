import { supabase } from '../lib/supabase';
import { Job } from '../types';
import { calculateJobStats } from './statistics';

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function getJobs(): Promise<(Job & { stats?: any })[]> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const jobsWithStats = await Promise.all(
    (data || []).map(async (job: Job) => {
      const stats = await calculateJobStats(job.id);
      return { ...job, ...stats };
    })
  );

  return jobsWithStats;
}

export async function getJob(id: string): Promise<Job | null> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createJob(job: {
  name: string;
  description: string;
  start_date: string;
  end_date?: string;
  status: string;
}): Promise<Job> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      ...job,
      user_id: userId,
      end_date: job.end_date || null,
      contract_amount: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Job creation error:', error);
    throw new Error(error.message || 'İş oluşturulamadı');
  }
  return data;
}

export async function updateJob(
  id: string,
  updates: Partial<Omit<Job, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Job> {
  const userId = await getUserId();

  const { data, error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error('Failed to update job');
  return data;
}

export async function deleteJob(id: string): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('jobs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new Error('Failed to delete job');
}

export async function addJob(data: {
  name: string;
  description?: string;
  status?: string;
  contract_amount?: number;
  start_date?: string;
  end_date?: string;
}): Promise<void> {
  const userId = await getUserId();

  const { error } = await supabase
    .from('jobs')
    .insert({
      user_id: userId,
      name: data.name,
      description: data.description || '',
      start_date: data.start_date || new Date().toISOString().split('T')[0],
      end_date: data.end_date || null,
      status: data.status || 'Aktif',
      contract_amount: data.contract_amount || 0,
    });

  if (error) {
    console.error('Job insert error:', error);
    throw new Error(error.message || 'Failed to add job');
  }
}
