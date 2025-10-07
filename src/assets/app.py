import pandas as pd
import plotly.express as px
from dash import Dash, dcc, html, dash_table
from dash.dependencies import Input, Output, State
import dash_bootstrap_components as dbc
import numpy as np

# Sample Data (replace with your actual data loading)
# Adding more detailed sample data for hierarchical report
data = {
    'חודש': ['ינואר', 'ינואר', 'ינואר', 'ינואר', 'פברואר', 'פברואר', 'פברואר', 'פברואר',
             'מרץ', 'מרץ', 'מרץ', 'מרץ', 'אפריל', 'אפריל', 'אפריל', 'אפריל'],
    'קוד מיון': ['הכנסות', 'הכנסות', 'הוצאות', 'הוצאות', 'הכנסות', 'הכנסות', 'הוצאות', 'הוצאות',
                 'הכנסות', 'הכנסות', 'הוצאות', 'הוצאות', 'הכנסות', 'הכנסות', 'הוצאות', 'הוצאות'],
    'חשבון': ['מכירות מוצר A', 'מכירות מוצר B', 'שכר עובדים', 'הוצאות שיווק',
              'מכירות מוצר A', 'מכירות מוצר B', 'שכר עובדים', 'הוצאות שיווק',
              'מכירות מוצר A', 'מכירות מוצר B', 'שכר עובדים', 'הוצאות שיווק',
              'מכירות מוצר A', 'מכירות מוצר B', 'שכר עובדים', 'הוצאות שיווק'],
    'סכום': [50000, 75000, 20000, 5000, 55000, 70000, 22000, 5200,
              60000, 80000, 21000, 5500, 62000, 78000, 23000, 5800]
}
df_full = pd.DataFrame(data)

# Pre-processing for the Hierarchical Report and Pivot
month_order = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

def prepare_data_for_display(dataframe, group_level, display_quarters=False):
    """
    Generates a DataFrame suitable for the hierarchical table based on grouping level.
    """
    df_temp = dataframe.copy()
    
    # Calculate initial pivot based on group_level
    if group_level == 'קוד מיון':
        pivot_index = ['קוד מיון']
    elif group_level == 'חשבון':
        pivot_index = ['חשבון']
    else: # 'קוד מיון' and 'חשבון'
        pivot_index = ['קוד מיון', 'חשבון']

    df_pivot_month = df_temp.pivot_table(
        index=pivot_index,
        columns='חודש',
        values='סכום',
        aggfunc='sum',
        fill_value=0
    )

    # Filter for only months present in the dataframe and ensure order
    present_months_in_data = [month for month in month_order if month in df_pivot_month.columns]
    df_pivot_month = df_pivot_month[present_months_in_data]

    # Calculate Quarterly Totals
    quarter_cols = []
    if display_quarters:
        q1_months = [m for m in ['ינואר', 'פברואר', 'מרץ'] if m in present_months_in_data]
        if q1_months:
            df_pivot_month['Q1/2025'] = df_pivot_month[q1_months].sum(axis=1)
            quarter_cols.append('Q1/2025')
        
        q2_months = [m for m in ['אפריל', 'מאי', 'יוני'] if m in present_months_in_data]
        if q2_months:
            df_pivot_month['Q2/2025'] = df_pivot_month[q2_months].sum(axis=1)
            quarter_cols.append('Q2/2025')
        # Add more quarters as needed

    # Calculate Total Sum
    df_pivot_month['סה"כ'] = df_pivot_month[present_months_in_data + quarter_cols].sum(axis=1)

    df_pivot_month = df_pivot_month.reset_index()

    # Add a 'סוג' column for coloring (Income/Expense) - relevant for 'קוד מיון' level
    if 'קוד מיון' in df_pivot_month.columns:
        df_pivot_month['סוג'] = df_pivot_month['קוד מיון'].apply(lambda x: 'הכנסות' if x == 'הכנסות' else 'הוצאות')
    else: # If grouping by 'חשבון' only, infer type from original df_full
        df_pivot_month['סוג'] = df_pivot_month['חשבון'].apply(
            lambda x: 'הכנסות' if x in df_full[df_full['קוד מיון'] == 'הכנסות']['חשבון'].unique() else 'הוצאות'
        )

    # Adjust expenses to be negative for proper P&L summation (if needed for drilldown totals)
    value_cols = present_months_in_data + quarter_cols + ['סה"כ']
    for col in value_cols:
        # Check if the column exists before trying to modify it
        if col in df_pivot_month.columns:
            df_pivot_month.loc[df_pivot_month['סוג'] == 'הוצאות', col] = -df_pivot_month.loc[df_pivot_month['סוג'] == 'הוצאות', col]
    
    return df_pivot_month, value_cols

# App Initialization
app = Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])

# Define brand colors
colors = {
    'background': '#FFFFFF',
    'text': '#000000',
    'primary_green': '#0A7C0A',  # Dark green from logo
    'light_gray': '#F2F2F2',
    'medium_gray': '#CCCCCC',
    'dark_gray': '#333333',
    'income_color': '#E6F3E6', # Very light green for income rows
    'expense_color': '#FCE4E4', # Very light red for expense rows (muted)
    'text_income': '#006400', # Dark green for income text
    'text_expense': '#B22222', # Firebrick for expense text
    'header_bg': '#0A7C0A',
    'header_text': 'white',
    'sub_header_bg': '#14A714', # Slightly lighter green for sub-headers
    'sub_header_text': 'white',
    'button_bg': '#0A7C0A',
    'button_text': 'white'
}

app.layout = dbc.Container([
    # --- Header ---
    html.Div([
        html.Img(src="/assets/logo.png", height="50px", style={'float': 'right', 'margin-left': '15px'}),
        html.H1("דוח רווח והפסד חודשי / רבעוני", style={
            'textAlign': 'right', 'color': colors['primary_green'], 'fontFamily': 'Assistant', 'fontWeight': 'bold'
        }),
        dbc.Row([
            dbc.Col(dbc.Input(id="search-bar", placeholder="חיפוש...", type="text", debounce=True), width={"size": 4, "offset": 0}),
            dbc.Col(dbc.Button("ייצוא לאקסל", id="export-button", color="success", className="me-1"), width={"size": 2, "offset": 0}),
        ], justify="end", className="mb-4")
    ], style={'backgroundColor': colors['background'], 'padding': '20px', 'borderRadius': '8px'}),

    html.Hr(),

    # --- Navigation Tabs ---
    dbc.Tabs([
        dbc.Tab(label="דוח היררכי חודשי", tab_id="hierarchical-report-tab",
                active_label_style={'color': colors['text'], 'backgroundColor': colors['primary_green']},
                label_style={'color': colors['primary_green'], 'borderColor': colors['primary_green'], 'borderWidth': '1px'}),
        dbc.Tab(label="Pivot חודשי", tab_id="pivot-tab",
                active_label_style={'color': colors['text'], 'backgroundColor': colors['primary_green']},
                label_style={'color': colors['primary_green'], 'borderColor': colors['primary_green'], 'borderWidth': '1px'}),
        dbc.Tab(label="דוח חודשי/רבעוני אינטראקטיבי", tab_id="monthly-quarterly-interactive-tab",
                active_label_style={'color': colors['text'], 'backgroundColor': colors['primary_green']},
                label_style={'color': colors['primary_green'], 'borderColor': colors['primary_green'], 'borderWidth': '1px'}),
        dbc.Tab(label="תנועות גולמיות", tab_id="raw-data-tab",
                active_label_style={'color': colors['text'], 'backgroundColor': colors['primary_green']},
                label_style={'color': colors['primary_green'], 'borderColor': colors['primary_green'], 'borderWidth': '1px'}),
    ], id="tabs", active_tab="hierarchical-report-tab", className="mb-4", style={'direction': 'rtl'}), # RTL for tabs

    # --- Tab Content ---
    html.Div(id="tab-content", style={'padding': '20px', 'backgroundColor': colors['background'], 'borderRadius': '8px'}),

], fluid=True, style={'backgroundColor': colors['light_gray'], 'padding': '20px', 'fontFamily': 'Noto Sans Hebrew'})

# --- Callbacks ---
@app.callback(
    Output("tab-content", "children"),
    Input("tabs", "active_tab")
)
def render_tab_content(active_tab):
    if active_tab == "hierarchical-report-tab":
        return html.Div([
            html.H3("דוח היררכי חודשי", style={'textAlign': 'right', 'color': colors['dark_gray'], 'fontFamily': 'Assistant', 'marginBottom': '20px'}),
            dbc.Row([
                dbc.Col(
                    dbc.RadioItems(
                        id='hierarchy-level-radio',
                        options=[
                            {'label': 'פירוט לפי קוד מיון (סיכום)', 'value': 'קוד מיון'},
                            {'label': 'פירוט מלא (קוד מיון + חשבון)', 'value': 'קוד מיון + חשבון'}
                        ],
                        value='קוד מיון + חשבון', # Default value
                        inline=True,
                        className="mb-3",
                        style={'textAlign': 'right', 'direction': 'rtl', 'fontFamily': 'Noto Sans Hebrew', 'color': colors['dark_gray']}
                    ), width=6
                ),
                dbc.Col(
                    dbc.Checklist(
                        id='show-quarters-checklist',
                        options=[{'label': 'הצג רבעונים', 'value': 'show'}],
                        value=['show'], # Default to showing quarters
                        inline=True,
                        className="mb-3",
                        style={'textAlign': 'right', 'direction': 'rtl', 'fontFamily': 'Noto Sans Hebrew', 'color': colors['dark_gray']}
                    ), width=6
                )
            ], justify="end"),
            dash_table.DataTable(
                id='hierarchical-table',
                style_table={
                    'overflowX': 'auto',
                    'direction': 'rtl',
                    'boxShadow': '3px 3px 10px rgba(0,0,0,0.1)',
                    'borderRadius': '8px',
                    'minHeight': '300px' # Give some initial height
                },
                style_cell={
                    'fontFamily': 'Noto Sans Hebrew',
                    'textAlign': 'right',
                    'padding': '10px',
                    'border': f'1px solid {colors["medium_gray"]}',
                    'whiteSpace': 'normal',
                    'height': 'auto',
                    'minWidth': '100px', 'width': '100px', 'maxWidth': '100px',
                    'color': colors['text']
                },
                style_header={
                    'backgroundColor': colors['primary_green'],
                    'color': 'white',
                    'fontWeight': 'bold',
                    'textAlign': 'right',
                    'fontFamily': 'Assistant',
                    'fontSize': '16px',
                    'border': f'1px solid {colors["medium_gray"]}'
                },
                 style_data_conditional=[
                    {'if': {'row_index': 'odd'}, 'backgroundColor': colors['light_gray']}, # Zebra stripes
                ],
                sort_action="native",
                filter_action="native",
                tooltip_delay=0,
                tooltip_duration=None,
            )
        ])
    elif active_tab == "pivot-tab":
        return html.Div([
            html.H3("טבלת Pivot חודשית", style={'textAlign': 'right', 'color': colors['dark_gray'], 'fontFamily': 'Assistant', 'marginBottom': '20px'}),
            dbc.Row([
                dbc.Col(
                    html.Div([
                        html.Label("בחר רמת פירוט לשורות:", style={'fontFamily': 'Noto Sans Hebrew', 'color': colors['dark_gray'], 'textAlign': 'right'}),
                        dcc.Dropdown(
                            id='pivot-row-level-dropdown',
                            options=[
                                {'label': 'לפי קוד מיון בלבד', 'value': 'קוד מיון'},
                                {'label': 'לפי חשבון בלבד', 'value': 'חשבון'},
                                {'label': 'לפי קוד מיון ואז חשבון', 'value': 'קוד מיון, חשבון'}
                            ],
                            value='קוד מיון, חשבון', # Default value
                            clearable=False,
                            style={'fontFamily': 'Noto Sans Hebrew', 'direction': 'rtl'}
                        )
                    ]), width=6
                )
            ], justify="end", className="mb-3"),
            dash_table.DataTable(
                id='pivot-table',
                style_table={
                    'overflowX': 'auto',
                    'direction': 'rtl',
                    'boxShadow': '3px 3px 10px rgba(0,0,0,0.1)',
                    'borderRadius': '8px',
                    'minHeight': '300px'
                },
                style_cell={
                    'fontFamily': 'Noto Sans Hebrew',
                    'textAlign': 'right',
                    'padding': '10px',
                    'border': f'1px solid {colors["medium_gray"]}',
                    'whiteSpace': 'normal',
                    'height': 'auto',
                    'minWidth': '100px', 'width': '100px', 'maxWidth': '100px',
                    'color': colors['text']
                },
                style_header={
                    'backgroundColor': colors['primary_green'],
                    'color': 'white',
                    'fontWeight': 'bold',
                    'textAlign': 'right',
                    'fontFamily': 'Assistant',
                    'fontSize': '16px',
                    'border': f'1px solid {colors["medium_gray"]}'
                },
                style_data_conditional=[
                    {'if': {'row_index': 'odd'}, 'backgroundColor': colors['light_gray']} # Zebra stripes
                ],
                sort_action="native",
                filter_action="native",
                tooltip_delay=0,
                tooltip_duration=None,
            )
        ])
    elif active_tab == "monthly-quarterly-interactive-tab":
        return html.Div([
            html.H3("דוח חודשי/רבעוני אינטראקטיבי (למתקדמים)", style={'textAlign': 'right', 'color': colors['dark_gray'], 'fontFamily': 'Assistant'}),
            html.P("הלשונית הזו תכלול אפשרויות מתקדמות לניתוח. בפיתוח.")
        ])
    elif active_tab == "raw-data-tab":
        return html.Div("תוכן לתנועות גולמיות (בפיתוח)")
    return html.Div("בחר טאב")

# Callback for Hierarchical Report
@app.callback(
    [Output('hierarchical-table', 'columns'),
     Output('hierarchical-table', 'data'),
     Output('hierarchical-table', 'tooltip_data'),
     Output('hierarchical-table', 'style_data_conditional')],
    [Input('hierarchy-level-radio', 'value'),
     Input('show-quarters-checklist', 'value')]
)
def update_hierarchical_table(group_level, show_quarters):
    display_quarters = 'show' in show_quarters
    
    df_display, value_cols = prepare_data_for_display(df_full, group_level, display_quarters)

    # Define columns for Dash DataTable
    if group_level == 'קוד מיון':
        header_cols = ['קוד מיון']
    elif group_level == 'חשבון':
        header_cols = ['חשבון']
    else: # 'קוד מיון + חשבון'
        header_cols = ['קוד מיון', 'חשבון']

    columns = [{"name": i, "id": i} for i in header_cols + value_cols]

    # Prepare tooltip data
    tooltip_data = [
        {
            col: {'value': f"{val:,.0f}", 'type': 'markdown'} if isinstance(val, (int, float)) else str(val)
            for col, val in row.items() if col in columns
        }
        for row in df_display.to_dict('records')
    ]
    
    # Conditional formatting for coloring rows/cells
    style_data_conditional = []
    # Zebra stripes
    style_data_conditional.append({'if': {'row_index': 'odd'}, 'backgroundColor': colors['light_gray']})

    for i in range(len(df_display)):
        row_type = df_display.iloc[i]['סוג']
        is_income = row_type == 'הכנסות'
        is_expense = row_type == 'הוצאות'
        
        # Apply row background color based on type
        row_bg_color = colors['income_color'] if is_income else (colors['expense_color'] if is_expense else colors['background'])
        row_text_color = colors['text_income'] if is_income else (colors['text_expense'] if is_expense else colors['text'])

        style_data_conditional.append({
            'if': {'row_index': i},
            'backgroundColor': row_bg_color,
            'color': row_text_color,
        })
        
        # Specific styling for hierarchy levels
        if group_level == 'קוד מיון' and 'קוד מיון' in df_display.columns:
             style_data_conditional.append({
                'if': {'row_index': i, 'column_id': 'קוד מיון'},
                'fontWeight': 'bold',
                'fontSize': '15px'
            })
        elif group_level == 'קוד מיון + חשבון' and 'קוד מיון' in df_display.columns:
            # Highlight parent category row if it's a category header
            style_data_conditional.append({
                'if': {'row_index': i, 'column_id': 'קוד מיון'},
                'fontWeight': 'bold',
                'fontSize': '15px'
            })
            style_data_conditional.append({
                'if': {'row_index': i, 'column_id': 'חשבון'},
                'paddingRight': '30px' # Indent sub-items
            })
        elif group_level == 'חשבון' and 'חשבון' in df_display.columns:
            style_data_conditional.append({
                'if': {'row_index': i, 'column_id': 'חשבון'},
                'fontWeight': 'bold'
            })


        # Styling for numeric values
        for col in value_cols:
            if col in df_display.columns:
                val = df_display.iloc[i][col]
                if isinstance(val, (int, float)) and val < 0:
                    style_data_conditional.append({
                        'if': {'row_index': i, 'column_id': col},
                        'color': colors['text_expense'] # Red for negative numbers
                    })
                # Total column styling
                if col == 'סה"כ':
                    style_data_conditional.append({
                        'if': {'row_index': i, 'column_id': 'סה"כ'},
                        'backgroundColor': colors['primary_green'] if not is_income and not is_expense else colors['sub_header_bg'],
                        'color': 'white',
                        'fontWeight': 'bold'
                    })
    
    # Add a global total row at the end
    total_row_data = {'קוד מיון': 'סה"כ כולל', 'חשבון': ''}
    for col in value_cols:
        if col in df_display.columns: # Check if column exists in df_display
            total_row_data[col] = df_display[col].sum()

    df_display_with_total = pd.concat([df_display, pd.DataFrame([total_row_data])], ignore_index=True)

    # Style the total row
    total_row_index = len(df_display_with_total) - 1
    style_data_conditional.append({
        'if': {'row_index': total_row_index},
        'backgroundColor': colors['primary_green'],
        'color': 'white',
        'fontWeight': 'bold',
        'fontSize': '16px'
    })


    return columns, df_display_with_total.to_dict('records'), tooltip_data, style_data_conditional


# Callback for Pivot Table
@app.callback(
    [Output('pivot-table', 'columns'),
     Output('pivot-table', 'data'),
     Output('pivot-table', 'tooltip_data'),
     Output('pivot-table', 'style_data_conditional')],
    [Input('pivot-row-level-dropdown', 'value')]
)
def update_pivot_table(selected_row_level):
    pivot_index_levels = [s.strip() for s in selected_row_level.split(',')]
    
    pivot_df = pd.pivot_table(df_full,
                              values=['סכום'], # Changed to 'סכום' as the only value
                              index=pivot_index_levels,
                              columns=['חודש'],
                              aggfunc='sum',
                              fill_value=0)

    present_months_in_data = [month for month in month_order if month in pivot_df.columns.get_level_values('חודש')]
    pivot_df = pivot_df[present_months_in_data] # Filter and order months

    # Add Quarter Totals
    quarter_cols = []
    q1_months = [m for m in ['ינואר', 'פברואר', 'מרץ'] if m in present_months_in_data]
    if q1_months:
        pivot_df['Q1/2025'] = pivot_df[q1_months].sum(axis=1)
        quarter_cols.append('Q1/2025')
    
    q2_months = [m for m in ['אפריל', 'מאי', 'יוני'] if m in present_months_in_data]
    if q2_months:
        pivot_df['Q2/2025'] = pivot_df[q2_months].sum(axis=1)
        quarter_cols.append('Q2/2025')
    # Add more quarters as needed

    # Add 'סה"כ' column for total sum across months and quarters
    pivot_df['סה"כ'] = pivot_df[present_months_in_data + quarter_cols].sum(axis=1)


    pivot_df = pivot_df.reset_index()

    # Determine 'סוג' for coloring
    if 'קוד מיון' in pivot_df.columns:
        pivot_df['סוג'] = pivot_df['קוד מיון'].apply(lambda x: 'הכנסות' if x == 'הכנסות' else 'הוצאות')
    elif 'חשבון' in pivot_df.columns: # If only by account, infer from original df_full
        pivot_df['סוג'] = pivot_df['חשבון'].apply(
            lambda x: 'הכנסות' if x in df_full[df_full['קוד מיון'] == 'הכנסות']['חשבון'].unique() else 'הוצאות'
        )
    else: # Fallback
        pivot_df['סוג'] = 'אחר'
    
    # Convert expense values to negative for correct P&L totals
    for col in present_months_in_data + quarter_cols + ['סה"כ']:
         if col in pivot_df.columns: # Ensure column exists
            pivot_df.loc[pivot_df['סוג'] == 'הוצאות', col] = -pivot_df.loc[pivot_df['סוג'] == 'הוצאות', col]


    # Add total row for the bottom
    total_row_data = {'סוג': 'סה"כ', 'קוד מיון': 'סה"כ', 'חשבון': ''} # חשבון might not exist
    for col in pivot_df.columns:
        if col not in pivot_index_levels and col != 'סוג' and col != 'חשבון': # Avoid summing index/type cols
            total_row_data[col] = pivot_df[col].sum()
    
    # Handle cases where 'חשבון' might not be in index_levels
    if 'חשבון' not in pivot_index_levels and 'חשבון' in total_row_data:
        del total_row_data['חשבון']

    pivot_df = pd.concat([pivot_df, pd.DataFrame([total_row_data])], ignore_index=True)

    # Define columns for Dash DataTable
    columns = [{"name": i, "id": i} for i in pivot_df.columns if i != 'סוג'] # Don't show 'סוג' column

    # Prepare tooltip data (for all columns except 'סוג')
    tooltip_data = [
        {
            column: {'value': f"{value:,.0f}", 'type': 'markdown'} if isinstance(value, (int, float)) else str(value)
            for column, value in row.items() if column != 'סוג'
        }
        for row in pivot_df.to_dict('records')
    ]

    # Conditional formatting for coloring rows/cells
    style_data_conditional = []
    # Zebra stripes
    style_data_conditional.append({'if': {'row_index': 'odd'}, 'backgroundColor': colors['light_gray']})

    for i in range(len(pivot_df)):
        row_type = pivot_df.iloc[i]['סוג']
        is_income = row_type == 'הכנסות'
        is_expense = row_type == 'הוצאות'
        is_total_row = row_type == 'סה"כ' # For the final total row

        # Apply row background color based on type
        if is_total_row:
            row_bg_color = colors['primary_green']
            row_text_color = 'white'
            font_weight = 'bold'
            font_size = '16px'
        else:
            row_bg_color = colors['income_color'] if is_income else (colors['expense_color'] if is_expense else colors['background'])
            row_text_color = colors['text_income'] if is_income else (colors['text_expense'] if is_expense else colors['text'])
            font_weight = 'normal'
            font_size = '14px'

        style_data_conditional.append({
            'if': {'row_index': i},
            'backgroundColor': row_bg_color,
            'color': row_text_color,
            'fontWeight': font_weight,
            'fontSize': font_size
        })

        # Indent sub-items if hierarchical level
        if 'קוד מיון' in pivot_index_levels and 'חשבון' in pivot_index_levels and 'חשבון' in pivot_df.columns:
            style_data_conditional.append({
                'if': {'row_index': i, 'column_id': 'חשבון'},
                'paddingRight': '30px'
            })
        
        # Highlight category headers if hierarchical
        if 'קוד מיון' in pivot_index_levels and 'קוד מיון' in pivot_df.columns:
            style_data_conditional.append({
                'if': {'row_index': i, 'column_id': 'קוד מיון'},
                'fontWeight': 'bold'
            })

        # Styling for numeric values
        for col in [c for c in pivot_df.columns if c not in pivot_index_levels and c != 'סוג']:
            val = pivot_df.iloc[i][col]
            if isinstance(val, (int, float)) and val < 0 and not is_total_row:
                style_data_conditional.append({
                    'if': {'row_index': i, 'column_id': col},
                    'color': colors['text_expense'] # Red for negative numbers
                })
            # Ensure numbers are left-aligned
            style_data_conditional.append({
                'if': {'row_index': i, 'column_id': col},
                'textAlign': 'left'
            })

    return columns, pivot_df.to_dict('records'), tooltip_data, style_data_conditional


# Main Dashboards (from previous steps, kept for completeness)
@app.callback(
    Output('profit-loss-bar-chart', 'figure'),
    Input('tabs', 'active_tab') # Dummy input to trigger on tab change
)
def update_profit_loss_bar_chart(active_tab):
    # Ensure to use df_full for consistent aggregation if needed, or adjust df logic
    df_agg = df_full.groupby('חודש').agg(
        הכנסות=('סכום', lambda x: x[df_full['קוד מיון'] == 'הכנסות'].sum()),
        הוצאות=('סכום', lambda x: x[df_full['קוד מיון'] == 'הוצאות'].sum())
    ).reset_index()
    df_agg['רווח'] = df_agg['הכנסות'] - df_agg['הוצאות']

    fig = px.bar(df_agg, x='חודש', y=['הכנסות', 'הוצאות', 'רווח'],
                 barmode='group',
                 title='רווח והפסד חודשי',
                 labels={'value': 'סכום', 'variable': 'מדד'},
                 color_discrete_map={'הכנסות': colors['primary_green'], 'הוצאות': colors['expense_color'], 'רווח': 'lightblue'},
                 hover_data={'value': ':.0f'} # Format to integer
    )
    fig.update_layout(
        plot_bgcolor=colors['background'],
        paper_bgcolor=colors['background'],
        font_color=colors['dark_gray'],
        font_family='Noto Sans Hebrew',
        xaxis_title=None,
        yaxis_title=None,
        legend_title_text='מדד',
        hoverlabel=dict(bgcolor="white", font_size=12, font_family="Noto Sans Hebrew"),
        margin=dict(l=20, r=20, t=40, b=20),
        xaxis={'categoryorder':'array', 'categoryarray':month_order}, # Ensure correct order
        bargap=0.3, # Adjust bar gap for better visual
    )
    fig.update_traces(marker_line_width=0, selector=dict(type='bar'))
    return fig

@app.callback(
    Output('expenses-pie-chart', 'figure'),
    Input('tabs', 'active_tab') # Dummy input to trigger on tab change
)
def update_expenses_pie_chart(active_tab):
    # Use df_full for pie chart as well for consistency
    df_expenses = df_full[df_full['קוד מיון'] == 'הוצאות'].groupby('חשבון')['סכום'].sum().reset_index()
    # Filter out categories that aren't specific expenses if needed, or sum by main expense types
    # df_expenses_sum = df_expenses[df_expenses['קטגוריה'] != 'סה"כ חודשי'].groupby('קטגוריה')['סכום'].sum().reset_index()

    # Define a color palette for expense categories (muted tones)
    expense_category_colors = px.colors.qualitative.Pastel # Using a pastel palette for better visual

    fig = px.pie(df_expenses, names='חשבון', values='סכום',
                 title='פילוח הוצאות',
                 color_discrete_sequence=expense_category_colors,
                 hover_data={'סכום': ':.0f'},
                 hole=0.4 # Donut chart
    )
    fig.update_layout(
        plot_bgcolor=colors['background'],
        paper_bgcolor=colors['background'],
        font_color=colors['dark_gray'],
        font_family='Noto Sans Hebrew',
        legend_title_text='קטגוריה',
        hoverlabel=dict(bgcolor="white", font_size=12, font_family="Noto Sans Hebrew"),
        margin=dict(l=20, r=20, t=40, b=20),
    )
    fig.update_traces(marker_line_width=1, marker_line_color='white',
                      textinfo='percent+label',
                     )
    return fig

if __name__ == '__main__':
    app.run_server(debug=True)