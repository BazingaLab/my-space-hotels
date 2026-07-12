// Step 1: Sign in — signIn returns data directly (not { user })
      const data = await signIn(form.email, form.password);
      const userId = data?.user?.id;
      const token = data?.session?.access_token;
      if (!userId) throw new Error("Authentication failed");

      // Step 2: Check role via backend API (bypasses RLS) — must send the
      // fresh session token, or this now-protected endpoint rejects it.
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/role/${userId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );