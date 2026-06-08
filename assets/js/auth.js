const SUPABASE_URL = 'https://ecgeikpxjjcgqpkwglhf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZ2Vpa3B4ampjZ3Fwa3dnbGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDAzNTIsImV4cCI6MjA5NTkxNjM1Mn0.EiqsAEPdDJHLCMfewFux4CIBKWduvAQ_f76WYBSZEHo';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// State
let isLoginMode = true;

// DOM Elements
const form = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const toggleBtn = document.getElementById('toggle-btn');
const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const errorMsg = document.getElementById('error-msg');
const successMsg = document.getElementById('success-msg');

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
    successMsg.style.display = 'none';
}

function showSuccess(msg) {
    successMsg.textContent = msg;
    successMsg.style.display = 'block';
    errorMsg.style.display = 'none';
}

function toggleMode() {
    isLoginMode = !isLoginMode;
    errorMsg.style.display = 'none';
    successMsg.style.display = 'none';
    emailInput.value = '';
    passwordInput.value = '';
    
    if (isLoginMode) {
        formTitle.textContent = 'Login';
        formSubtitle.textContent = 'Welcome back to Oprisa Hub';
        submitBtn.textContent = 'Sign In';
        toggleBtn.textContent = 'Create an Account';
    } else {
        formTitle.textContent = 'Register';
        formSubtitle.textContent = 'Apply to join Oprisa';
        submitBtn.textContent = 'Sign Up';
        toggleBtn.textContent = 'Back to Login';
    }
}

if(toggleBtn) {
    toggleBtn.addEventListener('click', toggleMode);
}

if(form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
        
        if (isLoginMode) {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) {
                showError(error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            } else {
                // Check profile status
                const { data: profile } = await supabaseClient.from('profiles').select('status, role').eq('id', data.user.id).single();
                
                if (profile && profile.status === 'pending') {
                    showError('Your account is pending admin approval.');
                    await supabaseClient.auth.signOut();
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign In';
                } else if (profile && profile.status === 'rejected') {
                    showError('Your account has been rejected.');
                    await supabaseClient.auth.signOut();
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Sign In';
                } else {
                    // Approved
                    window.location.href = 'dashboard.html';
                }
            }
        } else {
            const { data, error } = await supabaseClient.auth.signUp({ email, password });
            if (error) {
                showError(error.message);
            } else {
                showSuccess('Registration successful! Please wait for admin approval before logging in.');
                setTimeout(() => { toggleMode(); }, 3000);
            }
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign Up';
        }
    });
}

// Check session on load
window.addEventListener('DOMContentLoaded', async () => {
    if(window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
        const { data } = await supabaseClient.auth.getSession();
        if (data.session) {
            const { data: profile } = await supabaseClient.from('profiles').select('status').eq('id', data.session.user.id).single();
            if (profile && profile.status === 'approved') {
                window.location.href = 'dashboard.html';
            }
        }
    }
});
