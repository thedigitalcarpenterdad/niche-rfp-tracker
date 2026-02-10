-- Sample RFP data for demo purposes
INSERT INTO rfps (
    name, 
    description, 
    deadline, 
    walkthrough_date,
    contact, 
    organization, 
    status, 
    priority, 
    urgency_level,
    estimated_value,
    notes,
    created_at,
    updated_at
) VALUES 
(
    'Brooklyn Bridge Waterproofing Project',
    'Comprehensive waterproofing and facade restoration for historic Brooklyn Bridge approach structures',
    '2026-02-25 17:00:00',
    '2026-02-20 10:00:00',
    'projects@nycdot.gov',
    'NYC Department of Transportation',
    'pending',
    'high',
    'warning',
    750000.00,
    'Major infrastructure project. Site visit scheduled. Requires specialized historic building expertise.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'NYCHA Red Hook Houses Envelope Repair',
    'Building envelope waterproofing and repair work for Red Hook Houses complex',
    '2026-03-15 23:59:59',
    NULL,
    'rfp@nycha.nyc.gov',
    'New York City Housing Authority',
    'unread',
    'critical',
    'normal',
    1200000.00,
    'Large-scale NYCHA project. Multiple buildings involved. Pre-qualification required.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'Manhattan Luxury Condo Facade Restoration',
    'Local Law 11 facade inspection and waterproofing repairs for Upper East Side luxury building',
    '2026-02-18 15:00:00',
    '2026-02-15 14:00:00',
    'building@luxuryres.com',
    'Luxury Residences Management',
    'in_progress',
    'medium',
    'urgent',
    350000.00,
    'LL11 compliance project. Urgent timeline due to inspection deadline. Premium pricing opportunity.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'Queens Hospital Roof Waterproofing',
    'Emergency roof waterproofing and repair work for Queens General Hospital',
    '2026-02-12 12:00:00',
    NULL,
    'facilities@queenshosp.org',
    'Queens General Hospital',
    'pending',
    'critical',
    'overdue',
    450000.00,
    'URGENT: Roof leaks affecting patient care areas. Immediate response required.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    'Battery Park Residential Tower',
    'New construction waterproofing for luxury residential tower in Battery Park',
    '2026-04-01 17:00:00',
    '2026-03-20 09:00:00',
    'development@batterytower.com',
    'Battery Park Development LLC',
    'unread',
    'high',
    'normal',
    2500000.00,
    'New construction project. High-end residential. Long-term partnership opportunity.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Update the urgency levels based on current date
UPDATE rfps SET urgency_level = 
    CASE 
        WHEN deadline < datetime('now') THEN 'overdue'
        WHEN deadline <= datetime('now', '+2 days') THEN 'urgent'
        WHEN deadline <= datetime('now', '+7 days') THEN 'warning'
        ELSE 'normal'
    END;