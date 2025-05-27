package com.example.vechicle;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseExpandableListAdapter;
import android.widget.TextView;
import java.util.HashMap;
import java.util.List;

public class HelpAdapter extends BaseExpandableListAdapter {

    private Context context;
    private List<String> helpTopics;
    private HashMap<String, List<String>> helpDetails;

    public HelpAdapter(Context context, List<String> helpTopics, HashMap<String, List<String>> helpDetails) {
        this.context = context;
        this.helpTopics = helpTopics;
        this.helpDetails = helpDetails;
    }

    @Override
    public int getGroupCount() {
        return helpTopics.size();
    }

    @Override
    public int getChildrenCount(int groupPosition) {
        return helpDetails.get(helpTopics.get(groupPosition)).size();
    }

    @Override
    public Object getGroup(int groupPosition) {
        return helpTopics.get(groupPosition);
    }

    @Override
    public Object getChild(int groupPosition, int childPosition) {
        return helpDetails.get(helpTopics.get(groupPosition)).get(childPosition);
    }

    @Override
    public long getGroupId(int groupPosition) {
        return groupPosition;
    }

    @Override
    public long getChildId(int groupPosition, int childPosition) {
        return childPosition;
    }

    @Override
    public boolean hasStableIds() {
        return false;
    }

    @Override
    public View getGroupView(int groupPosition, boolean isExpanded, View convertView, ViewGroup parent) {
        String topicTitle = (String) getGroup(groupPosition);
        if (convertView == null) {
            convertView = LayoutInflater.from(context).inflate(android.R.layout.simple_expandable_list_item_1, parent, false);
        }

        TextView topicTextView = convertView.findViewById(android.R.id.text1);
        topicTextView.setText(topicTitle);
        topicTextView.setTextColor(context.getResources().getColor(android.R.color.white)); // Set text color to white
        topicTextView.setTextSize(18);
        topicTextView.setPadding(16, 16, 16, 16);

        return convertView;
    }

    @Override
    public View getChildView(int groupPosition, int childPosition, boolean isLastChild, View convertView, ViewGroup parent) {
        String detailText = (String) getChild(groupPosition, childPosition);
        if (convertView == null) {
            convertView = LayoutInflater.from(context).inflate(android.R.layout.simple_list_item_1, parent, false);
        }

        TextView detailTextView = convertView.findViewById(android.R.id.text1);
        detailTextView.setText(detailText);
        detailTextView.setTextColor(context.getResources().getColor(android.R.color.white)); // Set text color to white
        detailTextView.setTextSize(16);
        detailTextView.setPadding(16, 16, 16, 16);

        return convertView;
    }

    @Override
    public boolean isChildSelectable(int groupPosition, int childPosition) {
        return true;
    }
}
