-- ============================================================
-- ShareNest - Rollback offer -> invited (chat accepted)
-- 2026-03-24
-- ============================================================

create or replace function public.rollback_offer_to_invited(
  p_request_id uuid,
  p_actor_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.requests%rowtype;
  v_conv_id uuid;
  v_actor_id uuid;
begin
  v_actor_id := coalesce(auth.uid(), p_actor_id);

  if v_actor_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
    into v_req
  from public.requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_actor_id <> v_req.owner_id then
    raise exception 'Only owner can rollback offer';
  end if;

  if v_req.status::text <> 'offered' then
    raise exception 'Request must be offered';
  end if;

  -- Safety: do not rollback if someone already confirmed the offer.
  if v_req.owner_confirmed_at is not null or v_req.requester_confirmed_at is not null then
    raise exception 'Cannot rollback a confirmed offer';
  end if;

  update public.requests
  set
    status = 'invited',
    offered_at = null,
    offer_terms = null
  where id = p_request_id;

  select id
    into v_conv_id
  from public.conversations
  where request_id = p_request_id
  limit 1;

  if v_conv_id is not null then
    insert into public.messages (conversation_id, sender_id, content)
    values (
      v_conv_id,
      v_actor_id,
      'Oferta retirada. Chat aceptado sin oferta formal.'
    );
  end if;

  return coalesce(v_conv_id, '00000000-0000-0000-0000-000000000000'::uuid);
end;
$$;

revoke all on function public.rollback_offer_to_invited(uuid, uuid) from public;
grant execute on function public.rollback_offer_to_invited(uuid, uuid) to authenticated, service_role;
