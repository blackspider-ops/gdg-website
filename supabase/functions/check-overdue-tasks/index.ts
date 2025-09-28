import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
            throw new Error('Missing Supabase configuration')
        }

        // Create Supabase client with service role
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        // Get current date in YYYY-MM-DD format
        const currentDate = new Date().toISOString().split('T')[0]

        // Use the database function to mark overdue tasks and get results
        const { data: markResult, error: markError } = await supabase
            .rpc('check_and_mark_overdue_tasks')

        if (markError) {
            throw new Error(`Failed to mark overdue tasks: ${markError.message}`)
        }

        const markedCount = markResult?.[0]?.marked_count || 0
        const message = markResult?.[0]?.message || 'Check completed'
        
        if (markedCount === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    marked: 0,
                    notified: 0,
                    message: message
                }),
                {
                    status: 200,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // Fetch the overdue tasks that need email notifications
        const { data: overdueTasks, error: fetchError } = await supabase
            .from('communication_tasks')
            .select(`
                id, title, due_date, status,
                assigned_to:admin_users!communication_tasks_assigned_to_id_fkey(id, email, role),
                assigned_by:admin_users!communication_tasks_assigned_by_id_fkey(id, email, role)
            `)
            .eq('status', 'overdue')
            .lt('due_date', currentDate)
            .not('assigned_to', 'is', null)

        if (fetchError) {
            throw new Error(`Failed to fetch overdue tasks for notification: ${fetchError.message}`)
        }

        const tasksToUpdate = overdueTasks || []

        // Send overdue notifications
        let notificationsSent = 0
        const notificationPromises = tasksToUpdate.map(async (task) => {
            try {
                // Collect all email recipients (assigned user and assigner)
                const emailRecipients = []
                if (task.assigned_to?.email) {
                    emailRecipients.push(task.assigned_to.email)
                }
                if (task.assigned_by?.email && task.assigned_by.email !== task.assigned_to?.email) {
                    emailRecipients.push(task.assigned_by.email)
                }

                if (emailRecipients.length > 0) {
                    // Call the send-communication-email function
                    const { error: emailError } = await supabase.functions.invoke('send-communication-email', {
                        body: {
                            to_emails: emailRecipients,
                            subject: `[OVERDUE] Task: ${task.title}`,
                            message: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h2 style="color: #dc2626; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
                                        ⚠️ Task Automatically Marked as Overdue
                                    </h2>
                                    <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                                        <h3 style="color: #374151; margin-top: 0;">${task.title}</h3>
                                        <p style="color: #4b5563; margin: 10px 0;"><strong>Assigned to:</strong> ${task.assigned_to?.email || 'Unknown'}</p>
                                        <p style="color: #4b5563; margin: 10px 0;"><strong>Assigned by:</strong> ${task.assigned_by?.email || 'Unknown'}</p>
                                        <p style="color: #4b5563; margin: 10px 0;"><strong>Due Date:</strong> ${new Date(task.due_date).toLocaleDateString()}</p>
                                        <p style="color: #4b5563; margin: 10px 0;"><strong>Status:</strong> OVERDUE</p>
                                        <p style="color: #4b5563; margin: 10px 0;"><strong>Description:</strong> ${task.description || 'No description provided'}</p>
                                    </div>
                                    <p style="color: #dc2626; font-weight: bold;">This task is now overdue. Please take appropriate action.</p>
                                    <p><small>This is an automated message from the GDG@PSU Communications Hub. The task was automatically marked as overdue because the due date has passed.</small></p>
                                </div>
                            `,
                            email_type: 'task_notification',
                            sender_name: 'GDG@PSU Task Manager'
                        }
                    })

                    if (emailError) {
                        console.error(`Failed to send overdue email for task ${task.id}:`, emailError)
                        return { success: false, taskId: task.id, error: emailError.message }
                    } else {
                        return { success: true, taskId: task.id }
                    }
                } else {
                    return { success: false, taskId: task.id, error: 'No email recipients found' }
                }
            } catch (error) {
                console.error(`Error sending overdue email for task ${task.id}:`, error)
                return { success: false, taskId: task.id, error: error.message }
            }
        })

        // Wait for all email notifications to complete
        const notificationResults = await Promise.all(notificationPromises)
        notificationsSent = notificationResults.filter(result => result.success).length

        return new Response(
            JSON.stringify({
                success: true,
                marked: markedCount,
                notified: notificationsSent,
                message: `Marked ${markedCount} task(s) as overdue and sent ${notificationsSent} notification(s)`,
                details: {
                    tasks_updated: tasksToUpdate.map(task => ({
                        id: task.id,
                        title: task.title,
                        due_date: task.due_date
                    })),
                    notification_results: notificationResults
                }
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('Error in check-overdue-tasks function:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
                marked: 0,
                notified: 0
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})